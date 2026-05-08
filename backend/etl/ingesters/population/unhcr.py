import httpx
from etl.base import BaseIngester
from models.graph import ETLNode, ETLEdge
from graph.edge_rules import run_edge_rules

ORIGIN_COUNTRY_COORDS: dict[str, tuple[float, float]] = {
    "SYR": (34.802, 38.996), "AFG": (33.939, 67.710), "SOM": (5.152, 46.200),
    "SSD": (6.877, 31.307), "COD": (-4.038, 21.758), "MMR": (17.163, 95.956),
    "UKR": (48.379, 31.165), "ETH": (9.145, 40.489), "YEM": (15.552, 48.516),
    "MOZ": (-18.665, 35.530), "HTI": (18.971, -72.285), "NGA": (9.082, 8.675),
    "SDN": (12.862, 30.218), "CAF": (6.611, 20.939), "BDI": (-3.373, 29.918),
}

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
            if total < 1000 or origin not in ORIGIN_COUNTRY_COORDS:
                continue
            coords = ORIGIN_COUNTRY_COORDS[origin]
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
