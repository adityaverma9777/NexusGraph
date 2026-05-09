import httpx

from config import get_settings
from etl.base import BaseIngester
from etl.ingesters.common import COUNTRY_COORDS, clamp, slugify
from graph.edge_rules import run_edge_rules
from models.graph import ETLEdge, ETLNode

FALLBACK_SPECIES = [
    {"country": "IND", "species": "Panthera tigris", "category": "EN", "trend": "decreasing"},
    {"country": "IDN", "species": "Pongo abelii", "category": "CR", "trend": "decreasing"},
    {"country": "BRA", "species": "Ateles marginatus", "category": "EN", "trend": "decreasing"},
    {"country": "KEN", "species": "Diceros bicornis", "category": "CR", "trend": "stable"},
]


class IUCNRedListIngester(BaseIngester):
    domain = "ecology"
    source_name = "IUCN Red List"

    async def fetch(self) -> list[dict]:
        token = get_settings().iucn_api_token or ""
        if not token:
            return FALLBACK_SPECIES
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                url = f"https://apiv3.iucnredlist.org/api/v3/country/getspecies/IN?token={token}"
                response = await client.get(url)
                response.raise_for_status()
                rows = response.json().get("result", [])
                parsed = []
                for row in rows[:20]:
                    parsed.append(
                        {
                            "country": "IND",
                            "species": row.get("scientific_name", "Species"),
                            "category": row.get("category", "VU"),
                            "trend": row.get("population_trend", "unknown"),
                        }
                    )
                return parsed or FALLBACK_SPECIES
        except Exception:
            return FALLBACK_SPECIES

    def transform(self, raw: list[dict]) -> list[ETLNode]:
        nodes: list[ETLNode] = []
        severity_map = {"CR": 9.5, "EN": 8.2, "VU": 6.7, "NT": 4.5, "LC": 2.0}
        for row in raw:
            country = str(row.get("country", "IND")).upper()
            lat, lon = COUNTRY_COORDS.get(country, COUNTRY_COORDS["IND"])
            species = str(row.get("species", "Species"))
            category = str(row.get("category", "VU")).upper()
            nodes.append(
                ETLNode(
                    id=f"ecology_iucn_{country}_{slugify(species)}",
                    domain=self.domain,
                    entity_type="EndangeredSpecies",
                    label=f"IUCN Status - {species}",
                    lat=lat,
                    lon=lon,
                    country_code=country,
                    valid_from="2024-01-01",
                    valid_to="2024-12-31",
                    source=self.source_name,
                    severity=round(clamp(severity_map.get(category, 5.0)), 2),
                    properties={
                        "country": country,
                        "species": species,
                        "category": category,
                        "population_trend": str(row.get("trend", "unknown")),
                    },
                )
            )
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
