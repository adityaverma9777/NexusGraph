import httpx
from etl.base import BaseIngester
from models.graph import ETLNode, ETLEdge
from graph.edge_rules import run_edge_rules
from config import get_settings

CITIES = [
    {"city": "Delhi", "country": "IND", "lat": 28.704, "lon": 77.102},
    {"city": "Mumbai", "country": "IND", "lat": 19.076, "lon": 72.877},
    {"city": "Dhaka", "country": "BGD", "lat": 23.810, "lon": 90.412},
    {"city": "Karachi", "country": "PAK", "lat": 24.861, "lon": 67.010},
    {"city": "Lagos", "country": "NGA", "lat": 6.524, "lon": 3.379},
    {"city": "Jakarta", "country": "IDN", "lat": -6.175, "lon": 106.827},
    {"city": "Cairo", "country": "EGY", "lat": 30.033, "lon": 31.233},
    {"city": "Nairobi", "country": "KEN", "lat": -1.286, "lon": 36.817},
    {"city": "Manila", "country": "PHL", "lat": 14.599, "lon": 120.984},
    {"city": "Kinshasa", "country": "COD", "lat": -4.322, "lon": 15.322},
]

class OpenAQIngester(BaseIngester):
    domain = "disease"
    source_name = "OpenAQ Air Quality"

    async def fetch(self) -> list[dict]:
        settings = get_settings()
        api_key = settings.openaq_api_key or ""
        headers = {"X-API-Key": api_key} if api_key else {}
        results = []
        async with httpx.AsyncClient(timeout=30) as client:
            for city_info in CITIES:
                url = (
                    f"https://api.openaq.org/v3/locations"
                    f"?limit=3&radius=50000"
                    f"&coordinates={city_info['lat']},{city_info['lon']}"
                )
                try:
                    resp = await client.get(url, headers=headers)
                    if resp.status_code == 200:
                        for loc in resp.json().get("results", []):
                            loc["_city_info"] = city_info
                            results.append(loc)
                    else:
                        results.append({"_city_info": city_info, "_fallback": True})
                except Exception:
                    results.append({"_city_info": city_info, "_fallback": True})
        return results

    def transform(self, raw: list[dict]) -> list[ETLNode]:
        nodes: list[ETLNode] = []
        seen: set[str] = set()
        for row in raw:
            city_info = row.get("_city_info", {})
            cc = city_info.get("country", "")
            city = city_info.get("city", "")
            node_id = f"disease_airpollution_{cc}_{city.lower().replace(' ', '_')}_2024"
            if node_id in seen:
                continue
            seen.add(node_id)
            pm25 = 45.0
            if not row.get("_fallback"):
                sensors = row.get("sensors", [])
                vals = [s.get("lastValue", {}).get("value", 0) for s in sensors if "pm25" in s.get("parameter", {}).get("name", "").lower()]
                if vals:
                    pm25 = max(vals)
            severity = min(10.0, pm25 / 15)
            nodes.append(ETLNode(
                id=node_id,
                domain="disease",
                entity_type="AirPollutionEvent",
                label=f"Air Pollution — {city}",
                lat=city_info.get("lat"),
                lon=city_info.get("lon"),
                valid_from="2024-01-01",
                source=self.source_name,
                severity=round(severity, 2),
                properties={"city": city, "country": cc, "pm25": round(pm25, 2)},
            ))
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
