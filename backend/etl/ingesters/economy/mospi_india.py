from etl.base import BaseIngester
from etl.ingesters.common import INDIA_ADMIN1, clamp
from graph.edge_rules import run_edge_rules
from models.graph import ETLEdge, ETLNode

MOSPI_ROWS = [
    {"admin1": "MH", "year": 2024, "inflation": 5.8, "unemployment": 7.4, "gdp_index": 118},
    {"admin1": "TN", "year": 2024, "inflation": 4.9, "unemployment": 6.1, "gdp_index": 121},
    {"admin1": "KA", "year": 2024, "inflation": 5.1, "unemployment": 5.4, "gdp_index": 125},
    {"admin1": "WB", "year": 2024, "inflation": 6.2, "unemployment": 8.7, "gdp_index": 109},
    {"admin1": "UP", "year": 2024, "inflation": 5.6, "unemployment": 9.4, "gdp_index": 103},
    {"admin1": "BR", "year": 2024, "inflation": 6.8, "unemployment": 10.6, "gdp_index": 97},
]


class MoSPIIndiaIngester(BaseIngester):
    domain = "economy"
    source_name = "MoSPI India"

    async def fetch(self) -> list[dict]:
        return MOSPI_ROWS

    def transform(self, raw: list[dict]) -> list[ETLNode]:
        nodes: list[ETLNode] = []
        for row in raw:
            admin1_code = str(row.get("admin1", "")).upper()
            state = INDIA_ADMIN1.get(admin1_code)
            if not state:
                continue
            year = int(row.get("year", 2024))
            inflation = float(row.get("inflation", 0))
            unemployment = float(row.get("unemployment", 0))
            start = f"{year:04d}-01-01"
            end = f"{year:04d}-12-31"
            nodes.append(
                ETLNode(
                    id=f"economy_mospi_inflation_{admin1_code}_{year}",
                    domain=self.domain,
                    entity_type="InflationRate",
                    label=f"State Inflation - {state['name']} {year}",
                    lat=state["lat"],
                    lon=state["lon"],
                    country_code="IND",
                    admin1_code=admin1_code,
                    valid_from=start,
                    valid_to=end,
                    source=self.source_name,
                    severity=round(clamp(inflation / 1.5), 2),
                    properties={
                        "country": "IND",
                        "admin1": state["name"],
                        "admin1_code": admin1_code,
                        "value": inflation,
                        "gdp_index": float(row.get("gdp_index", 0)),
                    },
                )
            )
            nodes.append(
                ETLNode(
                    id=f"economy_mospi_unemployment_{admin1_code}_{year}",
                    domain=self.domain,
                    entity_type="UnemploymentRate",
                    label=f"State Unemployment - {state['name']} {year}",
                    lat=state["lat"],
                    lon=state["lon"],
                    country_code="IND",
                    admin1_code=admin1_code,
                    valid_from=start,
                    valid_to=end,
                    source=self.source_name,
                    severity=round(clamp(unemployment / 1.2), 2),
                    properties={
                        "country": "IND",
                        "admin1": state["name"],
                        "admin1_code": admin1_code,
                        "value": unemployment,
                        "gdp_index": float(row.get("gdp_index", 0)),
                    },
                )
            )
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
