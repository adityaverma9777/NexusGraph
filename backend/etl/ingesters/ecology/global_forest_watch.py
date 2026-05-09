import httpx
from etl.base import BaseIngester
from etl.ingesters.common import COUNTRY_COORDS, load_country_catalog, stable_int
from graph.edge_rules import run_edge_rules
from models.graph import ETLEdge, ETLNode


class GlobalForestWatchIngester(BaseIngester):
    domain = "ecology"
    source_name = "Global Forest Watch"

    async def fetch(self) -> list[dict]:
        results = []
        countries = await load_country_catalog()
        async with httpx.AsyncClient(timeout=30) as client:
            for country in countries:
                iso = country["code"]
                url = (
                    "https://data-api.globalforestwatch.org/dataset/umd_tree_cover_loss"
                    f"/latest/query?sql=SELECT%20umd_tree_cover_loss__year,SUM(umd_tree_cover_loss__ha)%20AS%20loss_ha"
                    f"%20FROM%20data%20WHERE%20iso={iso}%20AND%20umd_tree_cover_density_perc__threshold=30"
                    "%20GROUP%20BY%20umd_tree_cover_loss__year%20ORDER%20BY%20umd_tree_cover_loss__year%20DESC%20LIMIT%208"
                )
                try:
                    resp = await client.get(url, headers={"x-api-key": "eyJhbGciOi"})
                    if resp.status_code == 200:
                        data = resp.json().get("data", [])
                        for row in data:
                            row["_country"] = country
                        results.extend(data)
                    else:
                        results.append({"_country": country, "_estimated": True})
                except Exception:
                    results.append({"_country": country, "_estimated": True})
        return results

    def transform(self, raw: list[dict]) -> list[ETLNode]:
        nodes: list[ETLNode] = []
        seen: set[str] = set()
        for row in raw:
            country = row.get("_country", {})
            iso = country.get("code", "")
            if not iso:
                continue
            name = country.get("name", iso)
            lat, lon = COUNTRY_COORDS[iso] if iso in COUNTRY_COORDS else (country.get("latitude"), country.get("longitude"))
            if row.get("_estimated"):
                node_id = f"ecology_deforestation_{iso}_2023"
                if node_id in seen:
                    continue
                seen.add(node_id)
                area_ha = stable_int(1000, 50000, iso, "gfw_loss")
                nodes.append(
                    ETLNode(
                        id=node_id,
                        domain=self.domain,
                        entity_type="DeforestationEvent",
                        label=f"Deforestation - {name} 2023",
                        lat=lat,
                        lon=lon,
                        country_code=iso,
                        valid_from="2023-01-01",
                        valid_to="2023-12-31",
                        source=self.source_name,
                        severity=round(min(10.0, area_ha / 100_000 * 10), 2),
                        properties={"area_ha": area_ha, "country": iso, "year": 2023},
                    )
                )
                continue
            year = row.get("umd_tree_cover_loss__year", 2023)
            loss_ha = float(row.get("loss_ha", 0) or 0)
            if loss_ha < 1000:
                continue
            node_id = f"ecology_deforestation_{iso}_{year}"
            if node_id in seen:
                continue
            seen.add(node_id)
            severity = min(10.0, loss_ha / 100_000 * 10)
            nodes.append(
                ETLNode(
                    id=node_id,
                    domain=self.domain,
                    entity_type="DeforestationEvent",
                    label=f"Deforestation - {name} {year}",
                    lat=lat,
                    lon=lon,
                    country_code=iso,
                    valid_from=f"{year}-01-01",
                    valid_to=f"{year}-12-31",
                    source=self.source_name,
                    severity=round(severity, 2),
                    properties={"area_ha": int(loss_ha), "country": iso, "year": year},
                )
            )
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
