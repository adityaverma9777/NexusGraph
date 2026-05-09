from etl.base import BaseIngester
from etl.ingesters.common import clamp
from graph.edge_rules import run_edge_rules
from models.graph import ETLEdge, ETLNode

MARINE_ROWS = [
    {"zone": "arabian_sea", "country": "IND", "lat": 15.200, "lon": 72.800, "sst_anomaly_c": 1.1, "chlorophyll_anomaly_pct": -14.0},
    {"zone": "bay_of_bengal", "country": "BGD", "lat": 17.500, "lon": 88.600, "sst_anomaly_c": 0.9, "chlorophyll_anomaly_pct": -11.5},
    {"zone": "gulf_of_aden", "country": "YEM", "lat": 13.100, "lon": 48.000, "sst_anomaly_c": 1.4, "chlorophyll_anomaly_pct": -18.4},
]


class CopernicusMarineIngester(BaseIngester):
    domain = "water"
    source_name = "Copernicus Marine (CMEMS)"

    async def fetch(self) -> list[dict]:
        return MARINE_ROWS

    def transform(self, raw: list[dict]) -> list[ETLNode]:
        nodes: list[ETLNode] = []
        for row in raw:
            sst_anomaly = float(row.get("sst_anomaly_c", 0))
            chlorophyll = float(row.get("chlorophyll_anomaly_pct", 0))
            zone = str(row.get("zone", "zone"))
            nodes.append(
                ETLNode(
                    id=f"water_marine_{zone}_2024",
                    domain=self.domain,
                    entity_type="MarineStressEvent",
                    label=f"Marine Stress - {zone.replace('_', ' ')}",
                    lat=float(row.get("lat", 0)),
                    lon=float(row.get("lon", 0)),
                    country_code=str(row.get("country", "")).upper(),
                    valid_from="2024-01-01",
                    valid_to="2024-12-31",
                    source=self.source_name,
                    severity=round(clamp((sst_anomaly * 4) + (abs(chlorophyll) / 8)), 2),
                    properties={
                        "country": str(row.get("country", "")).upper(),
                        "zone": zone,
                        "sst_anomaly_c": sst_anomaly,
                        "chlorophyll_anomaly_pct": chlorophyll,
                    },
                )
            )
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
