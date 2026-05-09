from etl.base import BaseIngester
from etl.ingesters.common import INDIA_ADMIN1, clamp
from graph.edge_rules import run_edge_rules
from models.graph import ETLEdge, ETLNode

CENSUS_ROWS = [
    {"admin1": "MH", "population": 124904071, "urbanization": 45.2, "migrants": 16800000},
    {"admin1": "UP", "population": 241066874, "urbanization": 22.3, "migrants": 10700000},
    {"admin1": "TN", "population": 83697770, "urbanization": 48.5, "migrants": 8600000},
    {"admin1": "WB", "population": 100896618, "urbanization": 32.8, "migrants": 7200000},
    {"admin1": "BR", "population": 130725310, "urbanization": 15.3, "migrants": 6100000},
]


class IndiaCensusIngester(BaseIngester):
    domain = "population"
    source_name = "India Census"

    async def fetch(self) -> list[dict]:
        return CENSUS_ROWS

    def transform(self, raw: list[dict]) -> list[ETLNode]:
        nodes: list[ETLNode] = []
        for row in raw:
            admin1_code = str(row.get("admin1", "")).upper()
            state = INDIA_ADMIN1.get(admin1_code)
            if not state:
                continue
            population = int(row.get("population", 0))
            urbanization = float(row.get("urbanization", 0))
            migrants = int(row.get("migrants", 0))
            nodes.append(
                ETLNode(
                    id=f"population_census_snapshot_{admin1_code}_2011",
                    domain=self.domain,
                    entity_type="PopulationSnapshot",
                    label=f"Population Snapshot - {state['name']} 2011",
                    lat=state["lat"],
                    lon=state["lon"],
                    country_code="IND",
                    admin1_code=admin1_code,
                    valid_from="2011-01-01",
                    valid_to="2011-12-31",
                    source=self.source_name,
                    severity=round(clamp(population / 25_000_000), 2),
                    properties={
                        "country": "IND",
                        "admin1": state["name"],
                        "admin1_code": admin1_code,
                        "value": population,
                        "urbanization": urbanization,
                        "migrants": migrants,
                    },
                )
            )
            nodes.append(
                ETLNode(
                    id=f"population_census_urban_{admin1_code}_2011",
                    domain=self.domain,
                    entity_type="UrbanizationRate",
                    label=f"Urbanization - {state['name']} 2011",
                    lat=state["lat"],
                    lon=state["lon"],
                    country_code="IND",
                    admin1_code=admin1_code,
                    valid_from="2011-01-01",
                    valid_to="2011-12-31",
                    source=self.source_name,
                    severity=round(clamp(urbanization / 10), 2),
                    properties={
                        "country": "IND",
                        "admin1": state["name"],
                        "admin1_code": admin1_code,
                        "value": urbanization,
                        "migrants": migrants,
                    },
                )
            )
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
