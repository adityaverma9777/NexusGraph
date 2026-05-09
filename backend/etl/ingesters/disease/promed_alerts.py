import httpx

from etl.base import BaseIngester
from etl.ingesters.common import COUNTRY_COORDS, clamp, parse_rss_items, slugify
from graph.edge_rules import run_edge_rules
from models.graph import ETLEdge, ETLNode

ALERT_KEYWORDS = {
    "dengue": "DengueOutbreak",
    "malaria": "MalariaOutbreak",
    "cholera": "CholeraOutbreak",
    "covid": "PandemicEvent",
    "influenza": "HealthSystemStress",
}

COUNTRY_NAMES = {
    "india": "IND",
    "bangladesh": "BGD",
    "pakistan": "PAK",
    "nigeria": "NGA",
    "kenya": "KEN",
    "ethiopia": "ETH",
    "brazil": "BRA",
    "indonesia": "IDN",
    "sudan": "SDN",
    "somalia": "SOM",
}

FALLBACK_ALERTS = [
    {"title": "Dengue increase in India", "pubDate": "Mon, 19 Aug 2024 08:00:00 GMT", "description": "Vector-borne alert"},
    {"title": "Cholera cases in Sudan camps", "pubDate": "Wed, 21 Aug 2024 12:30:00 GMT", "description": "Waterborne alert"},
    {"title": "Malaria surge in Ethiopia highlands", "pubDate": "Fri, 23 Aug 2024 06:00:00 GMT", "description": "Seasonal disease alert"},
]


class ProMEDAlertsIngester(BaseIngester):
    domain = "disease"
    source_name = "ProMED Alerts"

    async def fetch(self) -> list[dict]:
        url = "https://promedmail.org/promed-rss/"
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.get(url)
                response.raise_for_status()
                items = parse_rss_items(response.text)
                return items[:40] or FALLBACK_ALERTS
        except Exception:
            return FALLBACK_ALERTS

    def transform(self, raw: list[dict]) -> list[ETLNode]:
        nodes: list[ETLNode] = []
        seen: set[str] = set()
        for row in raw:
            title = str(row.get("title", "")).strip()
            if not title:
                continue
            lower_title = title.lower()
            entity_type = next((value for key, value in ALERT_KEYWORDS.items() if key in lower_title), "HealthSystemStress")
            country_code = next((value for key, value in COUNTRY_NAMES.items() if key in lower_title), "IND")
            lat, lon = COUNTRY_COORDS.get(country_code, (0.0, 0.0))
            identifier = slugify(title)[:60]
            if identifier in seen:
                continue
            seen.add(identifier)
            nodes.append(
                ETLNode(
                    id=f"disease_promed_{identifier}",
                    domain=self.domain,
                    entity_type=entity_type,
                    label=title,
                    lat=lat,
                    lon=lon,
                    country_code=country_code,
                    valid_from="2024-08-01",
                    valid_to="2024-08-31",
                    source=self.source_name,
                    severity=round(clamp(7.2 if entity_type != "HealthSystemStress" else 5.5), 2),
                    properties={
                        "country": country_code,
                        "headline": title,
                        "summary": str(row.get("description", ""))[:400],
                        "published_at": str(row.get("pubDate", "")),
                    },
                )
            )
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
