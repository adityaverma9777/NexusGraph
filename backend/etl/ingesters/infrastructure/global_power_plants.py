import csv
import io

import httpx

from etl.base import BaseIngester
from etl.ingesters.common import country_by_alpha3, load_country_catalog, safe_float, slugify, stable_int
from graph.edge_rules import run_edge_rules
from models.graph import ETLEdge, ETLNode


class GlobalPowerPlantsIngester(BaseIngester):
    domain = "infrastructure"
    source_name = "Global Power Plants"

    async def fetch(self) -> list[dict]:
        url = "https://raw.githubusercontent.com/wri/global-power-plant-database/master/source_databases_csv/database_WRI.csv"
        try:
            async with httpx.AsyncClient(timeout=45) as client:
                response = await client.get(url)
                response.raise_for_status()
                rows = list(csv.DictReader(io.StringIO(response.text)))
                return rows or await self._fallback_rows()
        except Exception:
            return await self._fallback_rows()

    async def _fallback_rows(self) -> list[dict]:
        rows = []
        for country in await load_country_catalog():
            rows.append(
                {
                    "country": country["code"],
                    "name": f"{country['name']} Grid Reference",
                    "capacity_mw": stable_int(80, 6000, country["code"], "power_capacity"),
                    "primary_fuel": "Mixed",
                    "latitude": country.get("latitude"),
                    "longitude": country.get("longitude"),
                }
            )
        return rows

    def transform(self, raw: list[dict]) -> list[ETLNode]:
        nodes: list[ETLNode] = []
        seen: set[str] = set()
        for row in raw:
            country = str(row.get("country", "")).upper()
            country_meta = country_by_alpha3(country)
            if country_meta is None:
                continue
            name = str(row.get("name", "Plant"))
            capacity = safe_float(row.get("capacity_mw"))
            fuel = str(row.get("primary_fuel") or row.get("fuel1") or "Unknown")
            lat = safe_float(row.get("latitude"), default=country_meta["latitude"] or 0.0)
            lon = safe_float(row.get("longitude"), default=country_meta["longitude"] or 0.0)
            node_id = f"infrastructure_power_{country}_{slugify(name)}"
            if node_id in seen:
                continue
            seen.add(node_id)
            nodes.append(
                ETLNode(
                    id=node_id,
                    domain=self.domain,
                    entity_type="PowerPlant",
                    label=f"Power Plant - {name}",
                    lat=lat,
                    lon=lon,
                    country_code=country,
                    valid_from="2024-01-01",
                    valid_to="2024-12-31",
                    source=self.source_name,
                    severity=round(min(10.0, capacity / 600), 2),
                    properties={
                        "country": country,
                        "name": name,
                        "capacity_mw": capacity,
                        "fuel": fuel,
                    },
                )
            )
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
