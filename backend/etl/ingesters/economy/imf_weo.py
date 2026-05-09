from etl.base import BaseIngester
from etl.ingesters.common import COUNTRY_COORDS, clamp, load_country_catalog, stable_range, year_bounds
from graph.edge_rules import run_edge_rules
from models.graph import ETLEdge, ETLNode

WEO_ROWS = [
    {"country": "IND", "year": 2025, "gdp_growth": 6.5, "inflation": 4.6, "debt_gdp": 81.9},
    {"country": "BGD", "year": 2025, "gdp_growth": 5.7, "inflation": 6.8, "debt_gdp": 38.4},
    {"country": "PAK", "year": 2025, "gdp_growth": 3.2, "inflation": 12.4, "debt_gdp": 72.5},
    {"country": "NGA", "year": 2025, "gdp_growth": 3.1, "inflation": 24.8, "debt_gdp": 46.7},
    {"country": "KEN", "year": 2025, "gdp_growth": 5.2, "inflation": 5.4, "debt_gdp": 67.2},
    {"country": "EGY", "year": 2025, "gdp_growth": 4.1, "inflation": 18.7, "debt_gdp": 92.1},
]


class IMFWEOIngester(BaseIngester):
    domain = "economy"
    source_name = "IMF WEO"

    async def fetch(self) -> list[dict]:
        return [
            {
                "country": country["code"],
                "year": 2025,
                "gdp_growth": round(stable_range(-2.5, 7.5, country["code"], "weo_growth"), 2),
                "inflation": round(stable_range(1.0, 18.0, country["code"], "weo_inflation"), 2),
                "debt_gdp": round(stable_range(18.0, 115.0, country["code"], "weo_debt"), 2),
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
            year = int(row.get("year", 2025))
            start, end = year_bounds(year)
            inflation = float(row.get("inflation", 0))
            debt_gdp = float(row.get("debt_gdp", 0))
            nodes.append(
                ETLNode(
                    id=f"economy_imf_macro_{country}_{year}",
                    domain=self.domain,
                    entity_type="MacroeconomicForecast",
                    label=f"IMF WEO Outlook - {country} {year}",
                    lat=lat,
                    lon=lon,
                    country_code=country,
                    valid_from=start,
                    valid_to=end,
                    source=self.source_name,
                    severity=round(clamp((inflation / 3) + (debt_gdp / 20) - 2), 2),
                    properties={
                        "country": country,
                        "gdp_growth": float(row.get("gdp_growth", 0)),
                        "inflation": inflation,
                        "debt_gdp": debt_gdp,
                    },
                )
            )
            nodes.append(
                ETLNode(
                    id=f"economy_imf_debt_{country}_{year}",
                    domain=self.domain,
                    entity_type="DebtStressIndicator",
                    label=f"Debt Stress - {country} {year}",
                    lat=lat,
                    lon=lon,
                    country_code=country,
                    valid_from=start,
                    valid_to=end,
                    source=self.source_name,
                    severity=round(clamp(debt_gdp / 10), 2),
                    properties={
                        "country": country,
                        "debt_gdp": debt_gdp,
                        "gdp_growth": float(row.get("gdp_growth", 0)),
                    },
                )
            )
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
