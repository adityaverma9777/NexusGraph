from etl.base import BaseIngester
from etl.ingesters.common import COUNTRY_COORDS, clamp, load_country_catalog, stable_int, stable_range
from graph.edge_rules import run_edge_rules
from models.graph import ETLEdge, ETLNode

HDX_ROWS = [
    {"country": "SDN", "people_in_need": 24900000, "access_severity": 4.7},
    {"country": "SOM", "people_in_need": 6900000, "access_severity": 4.2},
    {"country": "YEM", "people_in_need": 18100000, "access_severity": 4.8},
    {"country": "AFG", "people_in_need": 23300000, "access_severity": 4.5},
]


class HDXHumanitarianIngester(BaseIngester):
    domain = "infrastructure"
    source_name = "HDX Humanitarian"

    async def fetch(self) -> list[dict]:
        return [
            {
                "country": country["code"],
                "people_in_need": stable_int(10000, 26000000, country["code"], "hdx_need"),
                "access_severity": round(stable_range(0.4, 4.9, country["code"], "hdx_access"), 2),
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
            people_in_need = float(row.get("people_in_need", 0))
            access_severity = float(row.get("access_severity", 0))
            nodes.append(
                ETLNode(
                    id=f"infrastructure_hdx_{country}_2024",
                    domain=self.domain,
                    entity_type="HumanitarianAccessConstraint",
                    label=f"Humanitarian Access Constraint - {country} 2024",
                    lat=lat,
                    lon=lon,
                    country_code=country,
                    valid_from="2024-01-01",
                    valid_to="2024-12-31",
                    source=self.source_name,
                    severity=round(clamp((access_severity * 1.6) + (people_in_need / 8_000_000)), 2),
                    properties={
                        "country": country,
                        "people_in_need": int(people_in_need),
                        "access_severity": round(access_severity, 2),
                    },
                )
            )
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
