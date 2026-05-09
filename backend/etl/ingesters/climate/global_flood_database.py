from etl.base import BaseIngester
from etl.ingesters.common import COUNTRY_COORDS, clamp, load_country_catalog, stable_int, stable_range
from graph.edge_rules import run_edge_rules
from models.graph import ETLEdge, ETLNode

FLOOD_ROWS = [
    {"country": "IND", "year": 2024, "month": 8, "affected_km2": 22100, "displaced": 340000},
    {"country": "BGD", "year": 2024, "month": 7, "affected_km2": 18400, "displaced": 270000},
    {"country": "PAK", "year": 2024, "month": 6, "affected_km2": 13800, "displaced": 145000},
    {"country": "BRA", "year": 2024, "month": 5, "affected_km2": 9400, "displaced": 82000},
    {"country": "ETH", "year": 2024, "month": 9, "affected_km2": 7600, "displaced": 68000},
]


class GlobalFloodDatabaseIngester(BaseIngester):
    domain = "climate"
    source_name = "Global Flood Database"

    async def fetch(self) -> list[dict]:
        return [
            {
                "country": country["code"],
                "year": 2024,
                "month": stable_int(1, 12, country["code"], "flood_month"),
                "affected_km2": round(stable_range(300.0, 26000.0, country["code"], "flood_area"), 2),
                "displaced": stable_int(1000, 360000, country["code"], "flood_displaced"),
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
            month = int(row.get("month", 1))
            start = f"{year:04d}-{month:02d}-01"
            end = f"{year:04d}-{month:02d}-28"
            affected_km2 = float(row.get("affected_km2", 0))
            displaced = int(row.get("displaced", 0))
            nodes.append(
                ETLNode(
                    id=f"climate_flood_{country}_{year}_{month:02d}",
                    domain=self.domain,
                    entity_type="FloodEvent",
                    label=f"Flood Event - {country} {year}-{month:02d}",
                    lat=lat,
                    lon=lon,
                    country_code=country,
                    valid_from=start,
                    valid_to=end,
                    source=self.source_name,
                    severity=round(clamp(affected_km2 / 2500), 2),
                    properties={
                        "country": country,
                        "area_ha": int(affected_km2 * 100),
                        "affected_km2": round(affected_km2, 2),
                        "persons_affected": displaced,
                    },
                )
            )
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
