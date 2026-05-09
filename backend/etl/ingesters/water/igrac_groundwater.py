from etl.base import BaseIngester
from etl.ingesters.common import COUNTRY_COORDS, clamp, load_country_catalog, stable_range
from graph.edge_rules import run_edge_rules
from models.graph import ETLEdge, ETLNode

GROUNDWATER_ROWS = [
    {"country": "IND", "year": 2024, "stress_index": 0.74, "depletion_cm": 12.5},
    {"country": "PAK", "year": 2024, "stress_index": 0.82, "depletion_cm": 14.2},
    {"country": "KEN", "year": 2024, "stress_index": 0.61, "depletion_cm": 9.1},
    {"country": "ETH", "year": 2024, "stress_index": 0.67, "depletion_cm": 10.8},
]


class IGRACGroundwaterIngester(BaseIngester):
    domain = "water"
    source_name = "IGRAC Groundwater"

    async def fetch(self) -> list[dict]:
        return [
            {
                "country": country["code"],
                "year": 2024,
                "stress_index": round(stable_range(0.18, 0.92, country["code"], "groundwater_stress"), 2),
                "depletion_cm": round(stable_range(0.5, 18.0, country["code"], "groundwater_depletion"), 2),
            }
            for country in await load_country_catalog()
        ]

    def transform(self, raw: list[dict]) -> list[ETLNode]:
        nodes: list[ETLNode] = []
        for row in raw:
            country = str(row.get("country", "")).upper()
            if country not in COUNTRY_COORDS:
                continue
            lat, lon = COUNTRY_COORDS[country]
            year = int(row.get("year", 2024))
            stress_index = float(row.get("stress_index", 0))
            nodes.append(
                ETLNode(
                    id=f"water_groundwater_{country}_{year}",
                    domain=self.domain,
                    entity_type="GroundwaterStress",
                    label=f"Groundwater Stress - {country} {year}",
                    lat=lat,
                    lon=lon,
                    country_code=country,
                    valid_from=f"{year:04d}-01-01",
                    valid_to=f"{year:04d}-12-31",
                    source=self.source_name,
                    severity=round(clamp(stress_index * 10), 2),
                    properties={
                        "country": country,
                        "stress_index": stress_index,
                        "depletion_cm": float(row.get("depletion_cm", 0)),
                    },
                )
            )
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
