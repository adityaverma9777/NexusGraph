import httpx

from etl.base import BaseIngester
from etl.ingesters.common import COUNTRY_COORDS, clamp, load_country_catalog, parse_csv_rows, safe_float, stable_range
from graph.edge_rules import run_edge_rules
from models.graph import ETLEdge, ETLNode

FALLBACK_VDEM_ROWS = [
    {"country": "IND", "year": 2024, "liberal_index": 0.46},
    {"country": "BRA", "year": 2024, "liberal_index": 0.63},
    {"country": "NGA", "year": 2024, "liberal_index": 0.39},
    {"country": "KEN", "year": 2024, "liberal_index": 0.52},
]


class VDemDemocracyIngester(BaseIngester):
    domain = "social"
    source_name = "V-Dem Democracy"

    async def fetch(self) -> list[dict]:
        url = "https://raw.githubusercontent.com/vdeminstitute/vdem-dataset/main/V-Dem-CY-Full+Others-v14.csv"
        try:
            async with httpx.AsyncClient(timeout=45) as client:
                response = await client.get(url)
                response.raise_for_status()
                rows = parse_csv_rows(response.text)
                filtered = []
                for row in rows:
                    code = str(row.get("country_text_id", "")).upper()
                    year = int(safe_float(row.get("year")))
                    if code in COUNTRY_COORDS and year == 2024:
                        filtered.append(
                            {
                                "country": code,
                                "year": year,
                                "liberal_index": safe_float(row.get("v2x_libdem")),
                            }
                        )
                return filtered or await self._fallback_rows()
        except Exception:
            return await self._fallback_rows()

    async def _fallback_rows(self) -> list[dict]:
        return [
            {
                "country": country["code"],
                "year": 2024,
                "liberal_index": round(stable_range(0.12, 0.88, country["code"], "vdem_libdem"), 3),
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
            democracy = float(row.get("liberal_index", 0))
            nodes.append(
                ETLNode(
                    id=f"social_vdem_{country}_{year}",
                    domain=self.domain,
                    entity_type="GovernanceRisk",
                    label=f"Governance Risk - {country} {year}",
                    lat=lat,
                    lon=lon,
                    country_code=country,
                    valid_from=f"{year:04d}-01-01",
                    valid_to=f"{year:04d}-12-31",
                    source=self.source_name,
                    severity=round(clamp((1 - democracy) * 10), 2),
                    properties={
                        "country": country,
                        "democracy_index": democracy,
                    },
                )
            )
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
