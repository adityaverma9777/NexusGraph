import httpx
from etl.base import BaseIngester
from models.graph import ETLNode, ETLEdge
from graph.edge_rules import run_edge_rules

WHO_INDICATORS = [
    {"code": "MALARIA_EST_CASES", "entity_type": "MalariaOutbreak", "label_prefix": "Malaria", "unit": "cases"},
    {"code": "DENGUE_CASES", "entity_type": "DengueOutbreak", "label_prefix": "Dengue", "unit": "cases"},
    {"code": "MDG_0000000026", "entity_type": "TuberculosisIncidence", "label_prefix": "TB", "unit": "per 100k"},
    {"code": "CHOLERA_0000000001", "entity_type": "CholeraOutbreak", "label_prefix": "Cholera", "unit": "cases"},
]

COUNTRY_COORDS: dict[str, tuple[float, float]] = {
    "IND": (20.593, 78.962),
    "BGD": (23.685, 90.356),
    "PAK": (30.375, 69.345),
    "NGA": (9.082, 8.675),
    "COD": (-4.038, 21.758),
    "KEN": (-0.023, 37.906),
    "ETH": (9.145, 40.489),
    "MOZ": (-18.665, 35.530),
    "TZA": (-6.369, 34.889),
    "UGA": (1.373, 32.290),
    "PHL": (12.879, 121.774),
    "IDN": (-0.789, 113.921),
    "BRA": (-14.235, -51.925),
    "VNM": (14.058, 108.277),
    "MMR": (17.163, 95.956),
    "AFG": (33.939, 67.710),
    "SOM": (5.152, 46.200),
    "YEM": (15.552, 48.516),
    "SDN": (12.862, 30.218),
    "HTI": (18.971, -72.285),
}

class WHOGHOIngester(BaseIngester):
    domain = "disease"
    source_name = "WHO Global Health Observatory"

    async def fetch(self) -> list[dict]:
        results = []
        async with httpx.AsyncClient(timeout=30) as client:
            for indicator in WHO_INDICATORS:
                url = f"https://ghoapi.azureedge.net/api/{indicator['code']}?$filter=TimeDim ge 2015"
                try:
                    resp = await client.get(url)
                    resp.raise_for_status()
                    data = resp.json()
                    for row in data.get("value", []):
                        row["_indicator"] = indicator
                    results.extend(data.get("value", []))
                except Exception as exc:
                    results.append({"_error": str(exc), "_indicator": indicator})
        return results

    def transform(self, raw: list[dict]) -> list[ETLNode]:
        nodes: list[ETLNode] = []
        seen: set[str] = set()
        for row in raw:
            if "_error" in row:
                continue
            indicator = row.get("_indicator", {})
            country = row.get("SpatialDim", "")
            year = row.get("TimeDim", 0)
            value = row.get("NumericValue")
            if not country or value is None:
                continue
            coords = COUNTRY_COORDS.get(country, (0.0, 0.0))
            node_id = f"disease_{indicator['entity_type'].lower()}_{country}_{year}"
            if node_id in seen:
                continue
            seen.add(node_id)
            severity = min(10.0, max(1.0, float(value) / 50000 * 10)) if indicator["unit"] == "cases" else min(10.0, float(value) / 30 * 10)
            nodes.append(ETLNode(
                id=node_id,
                domain="disease",
                entity_type=indicator["entity_type"],
                label=f"{indicator['label_prefix']} — {country} {year}",
                lat=coords[0],
                lon=coords[1],
                valid_from=f"{year}-01-01",
                valid_to=f"{year}-12-31",
                source=self.source_name,
                severity=round(severity, 2),
                properties={
                    "cases": float(value),
                    "unit": indicator["unit"],
                    "country": country,
                    "year": year,
                    "indicator_code": indicator["code"],
                },
            ))
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
