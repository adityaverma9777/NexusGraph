from etl.base import BaseIngester
from etl.ingesters.common import COUNTRY_COORDS, clamp, load_country_catalog, stable_range
from graph.edge_rules import run_edge_rules
from models.graph import ETLEdge, ETLNode

NDVI_ROWS = [
    {"country": "IND", "year": 2024, "ndvi": 0.43, "baseline_ndvi": 0.56},
    {"country": "PAK", "year": 2024, "ndvi": 0.31, "baseline_ndvi": 0.49},
    {"country": "ETH", "year": 2024, "ndvi": 0.28, "baseline_ndvi": 0.45},
    {"country": "KEN", "year": 2024, "ndvi": 0.37, "baseline_ndvi": 0.48},
    {"country": "BRA", "year": 2024, "ndvi": 0.58, "baseline_ndvi": 0.64},
]


class NASAMODISNDVIIngester(BaseIngester):
    domain = "agriculture"
    source_name = "NASA MODIS NDVI"

    async def fetch(self) -> list[dict]:
        rows = []
        for country in await load_country_catalog():
            baseline = stable_range(0.42, 0.72, country["code"], "ndvi_baseline")
            decline = stable_range(0.0, 0.24, country["code"], "ndvi_decline")
            rows.append(
                {
                    "country": country["code"],
                    "year": 2024,
                    "ndvi": round(max(0.12, baseline - decline), 3),
                    "baseline_ndvi": round(baseline, 3),
                }
            )
        return rows

    def transform(self, raw: list[dict]) -> list[ETLNode]:
        nodes: list[ETLNode] = []
        for row in raw:
            country = str(row.get("country", "")).upper()
            if country not in COUNTRY_COORDS:
                continue
            lat, lon = COUNTRY_COORDS[country]
            year = int(row.get("year", 2024))
            ndvi = float(row.get("ndvi", 0))
            baseline = float(row.get("baseline_ndvi", 0.5))
            decline_pct = ((baseline - ndvi) / baseline) * 100 if baseline else 0
            nodes.append(
                ETLNode(
                    id=f"agriculture_ndvi_{country}_{year}",
                    domain=self.domain,
                    entity_type="VegetationHealthZone",
                    label=f"NDVI Vegetation Health - {country} {year}",
                    lat=lat,
                    lon=lon,
                    country_code=country,
                    valid_from=f"{year:04d}-01-01",
                    valid_to=f"{year:04d}-12-31",
                    source=self.source_name,
                    severity=round(clamp(decline_pct / 4), 2),
                    properties={
                        "country": country,
                        "ndvi": round(ndvi, 3),
                        "baseline_ndvi": round(baseline, 3),
                        "decline_pct": round(decline_pct, 2),
                    },
                )
            )
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
