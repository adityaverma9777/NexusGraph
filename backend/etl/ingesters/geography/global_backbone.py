from collections.abc import Iterable

import pycountry

from etl.base import BaseIngester
from etl.ingesters.common import load_country_catalog
from models.graph import ETLEdge, ETLNode


async def load_world_bank_countries() -> list[dict]:
    return await load_country_catalog()


def iter_subdivisions() -> Iterable[dict]:
    for subdivision in pycountry.subdivisions:
        country_code = getattr(subdivision, "country_code", None)
        subdivision_code = getattr(subdivision, "code", None)
        subdivision_name = getattr(subdivision, "name", None)
        if not country_code or not subdivision_code or not subdivision_name:
            continue
        yield {
            "country_code": str(country_code).upper(),
            "subdivision_code": str(subdivision_code).upper(),
            "subdivision_name": str(subdivision_name),
            "subdivision_type": str(getattr(subdivision, "type", "")).strip(),
        }


class GeoBackboneIngester(BaseIngester):
    domain = "meta"
    source_name = "Global Geography Backbone"

    async def fetch(self) -> list[dict]:
        countries = await load_world_bank_countries()
        return [
            {"kind": "country", **country}
            for country in countries
        ] + [
            {"kind": "admin1", **subdivision}
            for subdivision in iter_subdivisions()
        ]

    def transform(self, raw: list[dict]) -> list[ETLNode]:
        countries: dict[str, dict] = {}
        for row in raw:
            if row.get("kind") == "country":
                countries[str(row.get("code") or "").upper()] = row

        nodes: list[ETLNode] = []
        seen: set[str] = set()

        for row in raw:
            kind = row.get("kind")
            if kind == "country":
                country_code = str(row.get("code") or "").upper()
                if len(country_code) != 3 or country_code in seen:
                    continue
                seen.add(country_code)
                nodes.append(
                    ETLNode(
                        id=f"geo_country_{country_code}",
                        domain="meta",
                        entity_type="CountryProfile",
                        label=str(row.get("name") or country_code),
                        lat=row.get("latitude"),
                        lon=row.get("longitude"),
                        country_code=country_code,
                        valid_from="1970-01-01",
                        source=self.source_name,
                        severity=0.0,
                        properties={
                            "country": country_code,
                            "country_name": row.get("name"),
                            "region": row.get("region"),
                            "income_level": row.get("income_level"),
                            "capital_city": row.get("capital_city"),
                        },
                    )
                )
                continue

            if kind != "admin1":
                continue

            country_code = str(row.get("country_code") or "").upper()
            subdivision_code = str(row.get("subdivision_code") or "").upper()
            subdivision_name = str(row.get("subdivision_name") or subdivision_code).strip()
            if len(country_code) != 3 or not subdivision_code:
                continue
            node_id = f"geo_admin1_{country_code}_{subdivision_code}"
            if node_id in seen:
                continue
            seen.add(node_id)
            country = countries.get(country_code, {})
            nodes.append(
                ETLNode(
                    id=node_id,
                    domain="meta",
                    entity_type="AdminSubdivision",
                    label=subdivision_name,
                    lat=country.get("latitude"),
                    lon=country.get("longitude"),
                    country_code=country_code,
                    admin1_code=subdivision_code,
                    valid_from="1970-01-01",
                    source=self.source_name,
                    severity=0.0,
                    properties={
                        "country": country_code,
                        "country_name": country.get("name"),
                        "subdivision_code": subdivision_code,
                        "subdivision_name": subdivision_name,
                        "subdivision_type": row.get("subdivision_type"),
                    },
                )
            )

        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return []
