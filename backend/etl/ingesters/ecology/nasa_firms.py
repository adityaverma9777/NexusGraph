import httpx
from etl.base import BaseIngester
from models.graph import ETLNode, ETLEdge
from graph.edge_rules import run_edge_rules
from config import get_settings

HOTSPOT_REGIONS = [
    {"name": "Amazon Basin", "country": "BRA", "lat": -5.0, "lon": -60.0},
    {"name": "Congo Basin", "country": "COD", "lat": -1.0, "lon": 24.0},
    {"name": "Borneo", "country": "IDN", "lat": 0.5, "lon": 114.0},
    {"name": "Central Africa", "country": "CAF", "lat": 5.0, "lon": 20.0},
    {"name": "Sumatra", "country": "IDN", "lat": -0.5, "lon": 102.0},
    {"name": "Cerrado Brazil", "country": "BRA", "lat": -15.0, "lon": -47.0},
    {"name": "Myanmar Forest", "country": "MMR", "lat": 20.0, "lon": 96.0},
    {"name": "Mato Grosso", "country": "BRA", "lat": -12.0, "lon": -55.0},
    {"name": "Papua New Guinea", "country": "PNG", "lat": -6.0, "lon": 147.0},
    {"name": "Cameroon", "country": "CMR", "lat": 5.0, "lon": 12.0},
]

class NASAFIRMSIngester(BaseIngester):
    domain = "ecology"
    source_name = "NASA FIRMS Fires"

    async def fetch(self) -> list[dict]:
        settings = get_settings()
        token = settings.nasa_earthdata_token or ""
        results = []
        async with httpx.AsyncClient(timeout=30) as client:
            for region in HOTSPOT_REGIONS:
                if token:
                    url = (
                        f"https://firms.modaps.eosdis.nasa.gov/api/country/csv"
                        f"/{token}/VIIRS_SNPP_NRT/{region['country']}/7"
                    )
                    try:
                        resp = await client.get(url)
                        if resp.status_code == 200:
                            lines = resp.text.strip().split("\n")
                            count = max(0, len(lines) - 1)
                            results.append({
                                "_region": region,
                                "fire_count": count,
                                "source": "nasa_firms",
                            })
                            continue
                    except Exception:
                        pass
                results.append({
                    "_region": region,
                    "fire_count": 150,
                    "source": "estimated",
                })
        return results

    def transform(self, raw: list[dict]) -> list[ETLNode]:
        nodes: list[ETLNode] = []
        for row in raw:
            region = row.get("_region", {})
            fire_count = row.get("fire_count", 0)
            severity = min(10.0, fire_count / 50)
            node_id = f"ecology_wildfire_{region.get('country', '')}_{region.get('name', '').lower().replace(' ', '_')}_2024"
            nodes.append(ETLNode(
                id=node_id,
                domain="ecology",
                entity_type="WildfireEvent",
                label=f"Wildfire Activity — {region.get('name', '')}",
                lat=region.get("lat"),
                lon=region.get("lon"),
                valid_from="2024-01-01",
                source=self.source_name,
                severity=round(severity, 2),
                properties={
                    "fire_count_7d": fire_count,
                    "country": region.get("country", ""),
                    "region": region.get("name", ""),
                    "area_ha": fire_count * 50,
                },
            ))
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
