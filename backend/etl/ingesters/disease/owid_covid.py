import csv
import io

import httpx

from etl.base import BaseIngester
from etl.ingesters.geography.global_backbone import load_world_bank_countries
from graph.edge_rules import run_edge_rules
from models.graph import ETLEdge, ETLNode

OWID_CSV_URL = "https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/owid-covid-data.csv"


class OWIDCovidIngester(BaseIngester):
    domain = "disease"
    source_name = "OWID COVID-19"

    async def fetch(self) -> list[dict]:
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.get(OWID_CSV_URL)
                resp.raise_for_status()
                reader = csv.DictReader(io.StringIO(resp.text))
                country_catalog = await load_world_bank_countries()
                coords_by_country = {
                    row["code"]: (row.get("latitude"), row.get("longitude"))
                    for row in country_catalog
                }
                rows: list[dict] = []
                for row in reader:
                    iso_code = str(row.get("iso_code", "")).strip().upper()
                    if len(iso_code) != 3:
                        continue
                    if not row.get("date", "").startswith(("2021", "2022", "2023")):
                        continue
                    lat, lon = coords_by_country.get(iso_code, (None, None))
                    row["_lat"] = lat
                    row["_lon"] = lon
                    rows.append(row)
                return rows
        except Exception as exc:
            return [{"_error": str(exc)}]

    def transform(self, raw: list[dict]) -> list[ETLNode]:
        nodes: list[ETLNode] = []
        by_country_year: dict[str, dict] = {}
        for row in raw:
            if "_error" in row:
                continue
            cc = str(row.get("iso_code", "")).upper()
            year = str(row.get("date", ""))[:4]
            key = f"{cc}_{year}"
            if key not in by_country_year:
                by_country_year[key] = {
                    "cc": cc,
                    "year": year,
                    "lat": row.get("_lat"),
                    "lon": row.get("_lon"),
                    "total_cases": [],
                    "total_deaths": [],
                    "excess_mortality": [],
                }
            try:
                if row.get("new_cases"):
                    by_country_year[key]["total_cases"].append(float(row["new_cases"]))
                if row.get("new_deaths"):
                    by_country_year[key]["total_deaths"].append(float(row["new_deaths"]))
                if row.get("excess_mortality"):
                    by_country_year[key]["excess_mortality"].append(float(row["excess_mortality"]))
            except (ValueError, TypeError):
                pass

        for data in by_country_year.values():
            cc = data["cc"]
            year = data["year"]
            total_cases = sum(data["total_cases"])
            total_deaths = sum(data["total_deaths"])
            if total_cases < 100:
                continue
            severity = min(10.0, total_deaths / 10000 * 10)
            nodes.append(
                ETLNode(
                    id=f"disease_pandemic_{cc}_{year}",
                    domain="disease",
                    entity_type="PandemicEvent",
                    label=f"COVID-19 — {cc} {year}",
                    lat=data.get("lat"),
                    lon=data.get("lon"),
                    valid_from=f"{year}-01-01",
                    valid_to=f"{year}-12-31",
                    source=self.source_name,
                    severity=round(severity, 2),
                    properties={
                        "total_cases": int(total_cases),
                        "total_deaths": int(total_deaths),
                        "country": cc,
                        "year": int(year),
                        "cases": int(total_cases),
                    },
                )
            )
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
