from etl.base import BaseIngester
from etl.ingesters.common import INDIA_ADMIN1, clamp, safe_float, year_bounds
from graph.edge_rules import run_edge_rules
from models.graph import ETLEdge, ETLNode

IMD_RAINFALL_ROWS = [
    {"admin1": "DL", "year": 2024, "rainfall_mm": 742, "normal_mm": 617},
    {"admin1": "MH", "year": 2024, "rainfall_mm": 881, "normal_mm": 1044},
    {"admin1": "TN", "year": 2024, "rainfall_mm": 1068, "normal_mm": 945},
    {"admin1": "WB", "year": 2024, "rainfall_mm": 1648, "normal_mm": 1452},
    {"admin1": "KA", "year": 2024, "rainfall_mm": 768, "normal_mm": 987},
    {"admin1": "TS", "year": 2024, "rainfall_mm": 944, "normal_mm": 765},
    {"admin1": "GJ", "year": 2024, "rainfall_mm": 604, "normal_mm": 798},
    {"admin1": "RJ", "year": 2024, "rainfall_mm": 382, "normal_mm": 512},
    {"admin1": "UP", "year": 2024, "rainfall_mm": 917, "normal_mm": 842},
    {"admin1": "BR", "year": 2024, "rainfall_mm": 1238, "normal_mm": 1105},
    {"admin1": "AS", "year": 2024, "rainfall_mm": 2175, "normal_mm": 2032},
    {"admin1": "KL", "year": 2024, "rainfall_mm": 2876, "normal_mm": 3010},
]


class IMDRainfallIngester(BaseIngester):
    domain = "climate"
    source_name = "IMD Gridded Rainfall"

    async def fetch(self) -> list[dict]:
        return IMD_RAINFALL_ROWS

    def transform(self, raw: list[dict]) -> list[ETLNode]:
        nodes: list[ETLNode] = []
        for row in raw:
            state = INDIA_ADMIN1.get(str(row.get("admin1", "")).upper())
            if not state:
                continue
            rainfall = safe_float(row.get("rainfall_mm"))
            normal = safe_float(row.get("normal_mm"), default=1.0)
            anomaly_pct = ((rainfall - normal) / normal) * 100
            year = int(row.get("year", 2024))
            start, end = year_bounds(year)
            admin1_code = str(row.get("admin1", "")).upper()
            nodes.append(
                ETLNode(
                    id=f"climate_imd_rainfall_{admin1_code}_{year}",
                    domain=self.domain,
                    entity_type="RainfallAnomaly",
                    label=f"IMD Rainfall Anomaly - {state['name']} {year}",
                    lat=state["lat"],
                    lon=state["lon"],
                    country_code="IND",
                    admin1_code=admin1_code,
                    valid_from=start,
                    valid_to=end,
                    source=self.source_name,
                    severity=round(clamp(5.0 + anomaly_pct / 12), 2),
                    properties={
                        "country": "IND",
                        "admin1": state["name"],
                        "admin1_code": admin1_code,
                        "rainfall_mm": round(rainfall, 2),
                        "normal_mm": round(normal, 2),
                        "anomaly_pct": round(anomaly_pct, 2),
                    },
                )
            )
            if anomaly_pct < -15:
                nodes.append(
                    ETLNode(
                        id=f"climate_imd_drought_{admin1_code}_{year}",
                        domain=self.domain,
                        entity_type="DroughtEvent",
                        label=f"IMD Drought Stress - {state['name']} {year}",
                        lat=state["lat"],
                        lon=state["lon"],
                        country_code="IND",
                        admin1_code=admin1_code,
                        valid_from=start,
                        valid_to=end,
                        source=self.source_name,
                        severity=round(clamp(abs(anomaly_pct) / 5), 2),
                        properties={
                            "country": "IND",
                            "admin1": state["name"],
                            "admin1_code": admin1_code,
                            "severity": round(abs(anomaly_pct) / 4, 2),
                            "rainfall_deficit_pct": round(abs(anomaly_pct), 2),
                        },
                    )
                )
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
