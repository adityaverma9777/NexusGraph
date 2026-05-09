from etl.base import BaseIngester
from etl.ingesters.common import COUNTRY_COORDS, clamp, load_country_catalog, stable_int, stable_range
from graph.edge_rules import run_edge_rules
from models.graph import ETLEdge, ETLNode

MARS_ROWS = [
    {"country": "IND", "year": 2024, "soil_moisture_index": 0.42, "water_deficit_pct": 23, "crop": "Rice"},
    {"country": "PAK", "year": 2024, "soil_moisture_index": 0.31, "water_deficit_pct": 34, "crop": "Wheat"},
    {"country": "ETH", "year": 2024, "soil_moisture_index": 0.27, "water_deficit_pct": 41, "crop": "Maize"},
    {"country": "BRA", "year": 2024, "soil_moisture_index": 0.49, "water_deficit_pct": 14, "crop": "Soybeans"},
]


class JRCMarsAgroIngester(BaseIngester):
    domain = "agriculture"
    source_name = "JRC MARS Agro"

    async def fetch(self) -> list[dict]:
        crops = ["Rice", "Wheat", "Maize", "Soybeans", "Sorghum", "Cassava"]
        return [
            {
                "country": country["code"],
                "year": 2024,
                "soil_moisture_index": round(stable_range(0.18, 0.68, country["code"], "mars_soil"), 2),
                "water_deficit_pct": round(stable_range(4.0, 48.0, country["code"], "mars_deficit"), 2),
                "crop": crops[stable_int(0, len(crops) - 1, country["code"], "mars_crop")],
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
            deficit_pct = float(row.get("water_deficit_pct", 0))
            crop = str(row.get("crop", "Crop"))
            nodes.append(
                ETLNode(
                    id=f"agriculture_mars_{country}_{crop.lower()}_{year}",
                    domain=self.domain,
                    entity_type="CropWaterDeficit",
                    label=f"Crop Water Deficit - {crop} {country} {year}",
                    lat=lat,
                    lon=lon,
                    country_code=country,
                    valid_from=f"{year:04d}-01-01",
                    valid_to=f"{year:04d}-12-31",
                    source=self.source_name,
                    severity=round(clamp(deficit_pct / 4), 2),
                    properties={
                        "country": country,
                        "crop": crop,
                        "soil_moisture_index": float(row.get("soil_moisture_index", 0)),
                        "water_deficit_pct": deficit_pct,
                    },
                )
            )
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
