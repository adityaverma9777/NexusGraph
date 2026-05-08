import httpx
from etl.base import BaseIngester
from models.graph import ETLNode, ETLEdge
from graph.edge_rules import run_edge_rules

GBIF_TAXA = [
    {"key": 5219243, "name": "Aedes aegypti", "entity_type": "MosquitoBreedingCondition", "domain": "ecology"},
    {"key": 5219247, "name": "Aedes albopictus", "entity_type": "MosquitoBreedingCondition", "domain": "ecology"},
    {"key": 6165453, "name": "Anopheles gambiae", "entity_type": "MosquitoBreedingCondition", "domain": "ecology"},
    {"key": 2432585, "name": "Panthera tigris", "entity_type": "WildlifeShiftEvent", "domain": "ecology"},
    {"key": 2441176, "name": "Elephas maximus", "entity_type": "WildlifeShiftEvent", "domain": "ecology"},
]

class GBIFIngester(BaseIngester):
    domain = "ecology"
    source_name = "GBIF Biodiversity"

    async def fetch(self) -> list[dict]:
        results = []
        async with httpx.AsyncClient(timeout=30) as client:
            for taxon in GBIF_TAXA:
                url = (
                    "https://api.gbif.org/v1/occurrence/search"
                    f"?taxonKey={taxon['key']}&hasCoordinate=true&hasGeospatialIssue=false"
                    "&year=2020,2024&limit=100"
                )
                try:
                    resp = await client.get(url)
                    resp.raise_for_status()
                    data = resp.json()
                    for row in data.get("results", []):
                        row["_taxon"] = taxon
                    results.extend(data.get("results", []))
                except Exception as exc:
                    results.append({"_error": str(exc), "_taxon": taxon})
        return results

    def transform(self, raw: list[dict]) -> list[ETLNode]:
        nodes: list[ETLNode] = []
        seen: set[str] = set()
        for row in raw:
            if "_error" in row:
                continue
            taxon = row.get("_taxon", {})
            lat = row.get("decimalLatitude")
            lon = row.get("decimalLongitude")
            year = row.get("year", 2023)
            country = row.get("countryCode", "")
            gbif_id = row.get("gbifID", "")
            if not lat or not lon:
                continue
            grid_lat = round(lat / 2) * 2
            grid_lon = round(lon / 2) * 2
            node_id = f"ecology_{taxon['entity_type'].lower()}_{grid_lat}_{grid_lon}_{year}"
            if node_id in seen:
                continue
            seen.add(node_id)
            is_vector = "Mosquito" in taxon["entity_type"] or "aedes" in taxon["name"].lower() or "anopheles" in taxon["name"].lower()
            severity = 7.5 if is_vector else 4.0
            nodes.append(ETLNode(
                id=node_id,
                domain=taxon["domain"],
                entity_type=taxon["entity_type"],
                label=f"{taxon['name']} occurrence — {country or 'Global'}",
                lat=grid_lat,
                lon=grid_lon,
                valid_from=f"{year}-01-01",
                valid_to=f"{year}-12-31",
                source=self.source_name,
                severity=severity,
                properties={
                    "species": taxon["name"],
                    "taxon_key": taxon["key"],
                    "country": country,
                    "year": year,
                    "breeding_index": 0.8 if is_vector else 0.3,
                    "gbif_id": str(gbif_id),
                },
            ))
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
