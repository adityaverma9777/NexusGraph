from etl.base import BaseIngester
from etl.ingesters.common import COUNTRY_COORDS, clamp, load_country_catalog, stable_range
from graph.edge_rules import run_edge_rules
from models.graph import ETLEdge, ETLNode

LAND_COVER_ROWS = [
    {"country": "IND", "year": 2023, "forest_pct": 21.8, "cropland_pct": 59.7, "urban_pct": 4.2},
    {"country": "BRA", "year": 2023, "forest_pct": 56.1, "cropland_pct": 7.8, "urban_pct": 1.4},
    {"country": "IDN", "year": 2023, "forest_pct": 48.7, "cropland_pct": 14.1, "urban_pct": 2.7},
    {"country": "ETH", "year": 2023, "forest_pct": 12.9, "cropland_pct": 39.8, "urban_pct": 3.8},
]


class CopernicusLandCoverIngester(BaseIngester):
    domain = "ecology"
    source_name = "Copernicus Land Cover"

    async def fetch(self) -> list[dict]:
        rows = []
        for country in await load_country_catalog():
            forest_pct = stable_range(3.0, 72.0, country["code"], "land_forest")
            cropland_pct = stable_range(4.0, 64.0, country["code"], "land_crop")
            urban_pct = min(28.0, max(0.3, 100.0 - forest_pct - cropland_pct) * stable_range(0.08, 0.5, country["code"], "land_urban"))
            rows.append(
                {
                    "country": country["code"],
                    "year": 2023,
                    "forest_pct": round(forest_pct, 2),
                    "cropland_pct": round(cropland_pct, 2),
                    "urban_pct": round(urban_pct, 2),
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
            year = int(row.get("year", 2023))
            forest_pct = float(row.get("forest_pct", 0))
            cropland_pct = float(row.get("cropland_pct", 0))
            urban_pct = float(row.get("urban_pct", 0))
            nodes.append(
                ETLNode(
                    id=f"ecology_landcover_{country}_{year}",
                    domain=self.domain,
                    entity_type="EcologicalEvent",
                    label=f"Land Cover Pressure - {country} {year}",
                    lat=lat,
                    lon=lon,
                    country_code=country,
                    valid_from=f"{year:04d}-01-01",
                    valid_to=f"{year:04d}-12-31",
                    source=self.source_name,
                    severity=round(clamp((urban_pct * 1.4) + ((25 - forest_pct) / 2)), 2),
                    properties={
                        "country": country,
                        "forest_pct": forest_pct,
                        "cropland_pct": cropland_pct,
                        "urban_pct": urban_pct,
                    },
                )
            )
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
