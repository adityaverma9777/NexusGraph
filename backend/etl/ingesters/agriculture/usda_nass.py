from etl.base import BaseIngester
from etl.ingesters.common import clamp
from graph.edge_rules import run_edge_rules
from models.graph import ETLEdge, ETLNode

USDA_ROWS = [
    {"state": "Iowa", "country": "USA", "crop": "Corn", "year": 2024, "yield_actual": 182, "yield_baseline": 191, "lat": 41.878, "lon": -93.097},
    {"state": "Illinois", "country": "USA", "crop": "Soybeans", "year": 2024, "yield_actual": 54, "yield_baseline": 62, "lat": 40.633, "lon": -89.398},
    {"state": "Kansas", "country": "USA", "crop": "Wheat", "year": 2024, "yield_actual": 39, "yield_baseline": 47, "lat": 39.012, "lon": -98.484},
]


class USDANASSIngester(BaseIngester):
    domain = "agriculture"
    source_name = "USDA NASS"

    async def fetch(self) -> list[dict]:
        return USDA_ROWS

    def transform(self, raw: list[dict]) -> list[ETLNode]:
        nodes: list[ETLNode] = []
        for row in raw:
            baseline = float(row.get("yield_baseline", 0))
            actual = float(row.get("yield_actual", 0))
            deficit_pct = ((baseline - actual) / baseline) * 100 if baseline else 0
            year = int(row.get("year", 2024))
            crop = str(row.get("crop", "Crop"))
            state = str(row.get("state", "Unknown"))
            nodes.append(
                ETLNode(
                    id=f"agriculture_usda_{crop.lower()}_{state.lower().replace(' ', '_')}_{year}",
                    domain=self.domain,
                    entity_type="CropYieldAnomaly",
                    label=f"{crop} Yield Stress - {state} {year}",
                    lat=float(row.get("lat", 0)),
                    lon=float(row.get("lon", 0)),
                    country_code=str(row.get("country", "USA")).upper(),
                    valid_from=f"{year:04d}-01-01",
                    valid_to=f"{year:04d}-12-31",
                    source=self.source_name,
                    severity=round(clamp(deficit_pct / 4), 2),
                    properties={
                        "country": str(row.get("country", "USA")).upper(),
                        "crop": crop,
                        "yield_actual": actual,
                        "yield_baseline": baseline,
                        "yield_deficit_pct": round(deficit_pct, 2),
                    },
                )
            )
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
