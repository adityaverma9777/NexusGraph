from etl.base import BaseIngester
from etl.ingesters.common import COUNTRY_COORDS, clamp, load_country_catalog, stable_range
from graph.edge_rules import run_edge_rules
from models.graph import ETLEdge, ETLNode

SURFACE_WATER_ROWS = [
    {"country": "IND", "year": 2024, "seasonality_loss_pct": 12.4, "permanent_loss_pct": 4.7},
    {"country": "ETH", "year": 2024, "seasonality_loss_pct": 18.8, "permanent_loss_pct": 6.9},
    {"country": "BRA", "year": 2024, "seasonality_loss_pct": 7.3, "permanent_loss_pct": 2.1},
    {"country": "PAK", "year": 2024, "seasonality_loss_pct": 14.9, "permanent_loss_pct": 5.4},
]


class JRCSurfaceWaterIngester(BaseIngester):
    domain = "water"
    source_name = "JRC Surface Water"

    async def fetch(self) -> list[dict]:
        return [
            {
                "country": country["code"],
                "year": 2024,
                "seasonality_loss_pct": round(stable_range(0.5, 21.0, country["code"], "surface_seasonality"), 2),
                "permanent_loss_pct": round(stable_range(0.1, 8.0, country["code"], "surface_permanent"), 2),
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
            seasonality = float(row.get("seasonality_loss_pct", 0))
            permanent = float(row.get("permanent_loss_pct", 0))
            nodes.append(
                ETLNode(
                    id=f"water_surface_{country}_{year}",
                    domain=self.domain,
                    entity_type="SurfaceWaterChange",
                    label=f"Surface Water Change - {country} {year}",
                    lat=lat,
                    lon=lon,
                    country_code=country,
                    valid_from=f"{year:04d}-01-01",
                    valid_to=f"{year:04d}-12-31",
                    source=self.source_name,
                    severity=round(clamp((seasonality / 2) + permanent), 2),
                    properties={
                        "country": country,
                        "seasonality_loss_pct": seasonality,
                        "permanent_loss_pct": permanent,
                    },
                )
            )
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
