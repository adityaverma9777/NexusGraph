import httpx
from etl.base import BaseIngester
from models.graph import ETLNode, ETLEdge
from graph.edge_rules import run_edge_rules

WB_INDICATORS = [
    {"code": "NY.GDP.MKTP.CD", "entity_type": "EconomicIndicator", "label_prefix": "GDP", "unit": "USD"},
    {"code": "SL.UEM.TOTL.ZS", "entity_type": "UnemploymentRate", "label_prefix": "Unemployment", "unit": "%"},
    {"code": "FP.CPI.TOTL.ZG", "entity_type": "InflationRate", "label_prefix": "Inflation", "unit": "%"},
    {"code": "AG.PRD.FOOD.XD", "entity_type": "FoodProductionIndex", "label_prefix": "Food Production", "unit": "index"},
    {"code": "SI.POV.GINI", "entity_type": "InequalityIndex", "label_prefix": "GINI Inequality", "unit": "index"},
]

COUNTRY_CONFIGS: list[dict] = [
    {"code": "IND", "lat": 20.593, "lon": 78.962},
    {"code": "BGD", "lat": 23.685, "lon": 90.356},
    {"code": "NGA", "lat": 9.082, "lon": 8.675},
    {"code": "ETH", "lat": 9.145, "lon": 40.489},
    {"code": "KEN", "lat": -0.023, "lon": 37.906},
    {"code": "PHL", "lat": 12.879, "lon": 121.774},
    {"code": "BRA", "lat": -14.235, "lon": -51.925},
    {"code": "IDN", "lat": -0.789, "lon": 113.921},
    {"code": "PAK", "lat": 30.375, "lon": 69.345},
    {"code": "TZA", "lat": -6.369, "lon": 34.889},
    {"code": "MOZ", "lat": -18.665, "lon": 35.530},
    {"code": "AFG", "lat": 33.939, "lon": 67.710},
    {"code": "YEM", "lat": 15.552, "lon": 48.516},
    {"code": "COD", "lat": -4.038, "lon": 21.758},
    {"code": "MMR", "lat": 17.163, "lon": 95.956},
    {"code": "VNM", "lat": 14.058, "lon": 108.277},
    {"code": "UKR", "lat": 48.379, "lon": 31.165},
    {"code": "EGY", "lat": 26.820, "lon": 30.802},
    {"code": "GHA", "lat": 7.946, "lon": -1.023},
    {"code": "SDN", "lat": 12.862, "lon": 30.218},
]

class WorldBankIngester(BaseIngester):
    domain = "economy"
    source_name = "World Bank Open Data"

    async def fetch(self) -> list[dict]:
        results = []
        async with httpx.AsyncClient(timeout=30) as client:
            for country in COUNTRY_CONFIGS:
                for ind in WB_INDICATORS:
                    url = (
                        f"https://api.worldbank.org/v2/country/{country['code']}"
                        f"/indicator/{ind['code']}?format=json&mrv=5&per_page=5"
                    )
                    try:
                        resp = await client.get(url)
                        resp.raise_for_status()
                        data = resp.json()
                        rows = data[1] if len(data) > 1 else []
                        for row in rows:
                            row["_country"] = country
                            row["_indicator"] = ind
                        results.extend(rows)
                    except Exception as exc:
                        results.append({"_error": str(exc)})
        return results

    def transform(self, raw: list[dict]) -> list[ETLNode]:
        nodes: list[ETLNode] = []
        seen: set[str] = set()
        for row in raw:
            if "_error" in row or row.get("value") is None:
                continue
            country = row.get("_country", {})
            indicator = row.get("_indicator", {})
            year = row.get("date", "")
            value = row.get("value")
            cc = country.get("code", "")
            node_id = f"economy_{indicator['entity_type'].lower()}_{cc}_{year}"
            if node_id in seen:
                continue
            seen.add(node_id)
            if indicator["code"] == "SL.UEM.TOTL.ZS":
                severity = min(10.0, float(value) / 3)
            elif indicator["code"] == "FP.CPI.TOTL.ZG":
                severity = min(10.0, max(0.0, float(value) / 5))
            elif indicator["code"] == "AG.PRD.FOOD.XD":
                severity = max(0.0, 10.0 - float(value) / 20)
            else:
                severity = 5.0
            nodes.append(ETLNode(
                id=node_id,
                domain="economy",
                entity_type=indicator["entity_type"],
                label=f"{indicator['label_prefix']} — {cc} {year}",
                lat=country.get("lat"),
                lon=country.get("lon"),
                valid_from=f"{year}-01-01",
                valid_to=f"{year}-12-31",
                source=self.source_name,
                severity=round(severity, 2),
                properties={
                    "value": float(value),
                    "unit": indicator["unit"],
                    "country": cc,
                    "year": year,
                    "indicator_code": indicator["code"],
                    "price_index_change": float(value) if indicator["code"] == "FP.CPI.TOTL.ZG" else 0,
                },
            ))
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
