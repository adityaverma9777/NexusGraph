import httpx
from etl.base import BaseIngester
from etl.ingesters.common import COUNTRY_COORDS
from models.graph import ETLNode, ETLEdge
from graph.edge_rules import run_edge_rules

class UNHCRIngester(BaseIngester):
    domain = "population"
    source_name = "UNHCR Displacement Data"

    async def fetch(self) -> list[dict]:
        url = "https://api.unhcr.org/population/v1/population/?limit=100&page=1&year=2023"
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(url, headers={"Accept": "application/json"})
                resp.raise_for_status()
                return resp.json().get("items", [])
        except Exception as exc:
            return [{"_error": str(exc)}]

    def transform(self, raw: list[dict]) -> list[ETLNode]:
        nodes: list[ETLNode] = []
        seen: set[str] = set()
        for row in raw:
            if "_error" in row:
                continue
            origin = row.get("coo_iso", "")
            year = row.get("year", 2023)
            refugees = row.get("refugees", 0) or 0
            idps = row.get("idps", 0) or 0
            total = (refugees or 0) + (idps or 0)
            if total < 1000 or origin not in COUNTRY_COORDS:
                continue
            coords = COUNTRY_COORDS[origin]
            node_id = f"population_displacement_{origin}_{year}"
            if node_id in seen:
                continue
            seen.add(node_id)
            severity = min(10.0, max(1.0, total / 500_000 * 10))
            nodes.append(ETLNode(
                id=node_id,
                domain="population",
                entity_type="DisplacementEvent",
                label=f"Displacement — {origin} {year}",
                lat=coords[0],
                lon=coords[1],
                country_code=origin,
                valid_from=f"{year}-01-01",
                valid_to=f"{year}-12-31",
                source=self.source_name,
                severity=round(severity, 2),
                properties={
                    "refugees": int(refugees),
                    "idps": int(idps),
                    "total_displaced": int(total),
                    "origin_country": origin,
                    "year": year,
                    "persons_affected": int(total),
                },
            ))
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
