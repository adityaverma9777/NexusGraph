from etl.base import BaseIngester
from etl.ingesters.common import clamp
from graph.edge_rules import run_edge_rules
from models.graph import ETLEdge, ETLNode

WORLDPOP_ROWS = [
    {"cell": "dhaka_core", "country": "BGD", "lat": 23.810, "lon": 90.412, "population_density": 45600, "year": 2020},
    {"cell": "lagos_mainland", "country": "NGA", "lat": 6.524, "lon": 3.379, "population_density": 33200, "year": 2020},
    {"cell": "mumbai_inner", "country": "IND", "lat": 19.076, "lon": 72.877, "population_density": 28900, "year": 2020},
    {"cell": "manila_core", "country": "PHL", "lat": 14.599, "lon": 120.984, "population_density": 31800, "year": 2020},
]


class WorldPopGriddedIngester(BaseIngester):
    domain = "population"
    source_name = "WorldPop Gridded"

    async def fetch(self) -> list[dict]:
        return WORLDPOP_ROWS

    def transform(self, raw: list[dict]) -> list[ETLNode]:
        nodes: list[ETLNode] = []
        for row in raw:
            year = int(row.get("year", 2020))
            density = float(row.get("population_density", 0))
            nodes.append(
                ETLNode(
                    id=f"population_worldpop_{row.get('cell', 'cell')}_{year}",
                    domain=self.domain,
                    entity_type="PopulationDensityGrid",
                    label=f"Population Density Grid - {row.get('cell', 'cell')} {year}",
                    lat=float(row.get("lat", 0)),
                    lon=float(row.get("lon", 0)),
                    country_code=str(row.get("country", "")).upper(),
                    valid_from=f"{year:04d}-01-01",
                    valid_to=f"{year:04d}-12-31",
                    source=self.source_name,
                    severity=round(clamp(density / 5000), 2),
                    properties={
                        "country": str(row.get("country", "")).upper(),
                        "cell": str(row.get("cell", "")),
                        "population_density": density,
                    },
                )
            )
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
