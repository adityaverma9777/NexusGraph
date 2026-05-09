from etl.base import BaseIngester
from etl.ingesters.common import INDIA_ADMIN1, clamp
from graph.edge_rules import run_edge_rules
from models.graph import ETLEdge, ETLNode

IDSP_ROWS = [
    {"admin1": "DL", "entity_type": "DengueOutbreak", "cases": 1240, "week": 34, "year": 2024},
    {"admin1": "MH", "entity_type": "DengueOutbreak", "cases": 1875, "week": 34, "year": 2024},
    {"admin1": "TN", "entity_type": "DengueOutbreak", "cases": 2142, "week": 34, "year": 2024},
    {"admin1": "WB", "entity_type": "MalariaOutbreak", "cases": 962, "week": 34, "year": 2024},
    {"admin1": "AS", "entity_type": "MalariaOutbreak", "cases": 1118, "week": 34, "year": 2024},
    {"admin1": "UP", "entity_type": "CholeraOutbreak", "cases": 488, "week": 34, "year": 2024},
    {"admin1": "BR", "entity_type": "CholeraOutbreak", "cases": 534, "week": 34, "year": 2024},
]


class IDSPIndiaIngester(BaseIngester):
    domain = "disease"
    source_name = "IDSP India"

    async def fetch(self) -> list[dict]:
        return IDSP_ROWS

    def transform(self, raw: list[dict]) -> list[ETLNode]:
        nodes: list[ETLNode] = []
        for row in raw:
            admin1_code = str(row.get("admin1", "")).upper()
            state = INDIA_ADMIN1.get(admin1_code)
            if not state:
                continue
            year = int(row.get("year", 2024))
            week = int(row.get("week", 1))
            cases = int(row.get("cases", 0))
            entity_type = str(row.get("entity_type", "HealthSystemStress"))
            nodes.append(
                ETLNode(
                    id=f"disease_idsp_{entity_type.lower()}_{admin1_code}_{year}_w{week:02d}",
                    domain=self.domain,
                    entity_type=entity_type,
                    label=f"{entity_type} - {state['name']} W{week:02d} {year}",
                    lat=state["lat"],
                    lon=state["lon"],
                    country_code="IND",
                    admin1_code=admin1_code,
                    valid_from=f"{year:04d}-08-01",
                    valid_to=f"{year:04d}-08-31",
                    source=self.source_name,
                    severity=round(clamp(cases / 180), 2),
                    properties={
                        "country": "IND",
                        "admin1": state["name"],
                        "admin1_code": admin1_code,
                        "cases": cases,
                        "week": week,
                        "year": year,
                    },
                )
            )
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
