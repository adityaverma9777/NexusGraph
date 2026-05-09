import httpx

from etl.base import BaseIngester
from etl.ingesters.common import COUNTRY_COORDS, clamp, safe_float, slugify
from graph.edge_rules import run_edge_rules
from models.graph import ETLEdge, ETLNode

OVERPASS_QUERIES = [
    {"country": "IND", "label": "Delhi", "lat": 28.704, "lon": 77.102},
    {"country": "NGA", "label": "Lagos", "lat": 6.524, "lon": 3.379},
    {"country": "KEN", "label": "Nairobi", "lat": -1.286, "lon": 36.817},
]


class OSMOverpassIngester(BaseIngester):
    domain = "infrastructure"
    source_name = "OSM Overpass"

    async def fetch(self) -> list[dict]:
        results: list[dict] = []
        query_template = """
        [out:json][timeout:25];
        (
          node(around:30000,{lat},{lon})[amenity=hospital];
          node(around:30000,{lat},{lon})[power=substation];
        );
        out count;
        """
        async with httpx.AsyncClient(timeout=30) as client:
            for item in OVERPASS_QUERIES:
                try:
                    response = await client.post(
                        "https://overpass-api.de/api/interpreter",
                        data=query_template.format(lat=item["lat"], lon=item["lon"]),
                        headers={"Content-Type": "text/plain"},
                    )
                    if response.status_code != 200:
                        raise ValueError("overpass request failed")
                    payload = response.json()
                    count_record = next((element for element in payload.get("elements", []) if element.get("type") == "count"), {})
                    results.append(
                        {
                            **item,
                            "count": safe_float(count_record.get("tags", {}).get("total"), default=12),
                        }
                    )
                except Exception:
                    results.append({**item, "count": 12})
        return results

    def transform(self, raw: list[dict]) -> list[ETLNode]:
        nodes: list[ETLNode] = []
        for row in raw:
            label = str(row.get("label", "Region"))
            country = str(row.get("country", "")).upper()
            count = safe_float(row.get("count"), default=12)
            nodes.append(
                ETLNode(
                    id=f"infrastructure_osm_{slugify(label)}",
                    domain=self.domain,
                    entity_type="CriticalInfrastructure",
                    label=f"Critical Infrastructure Density - {label}",
                    lat=float(row.get("lat", 0)),
                    lon=float(row.get("lon", 0)),
                    country_code=country,
                    valid_from="2024-01-01",
                    valid_to="2024-12-31",
                    source=self.source_name,
                    severity=round(clamp(10 - (count / 3)), 2),
                    properties={
                        "country": country,
                        "location": label,
                        "facility_count": round(count, 2),
                    },
                )
            )
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
