import asyncio

import httpx
from loguru import logger

from etl.base import BaseIngester
from etl.ingesters.geography.global_backbone import load_world_bank_countries
from graph.edge_rules import run_edge_rules
from models.graph import ETLEdge, ETLNode

WB_INDICATORS = [
    {"code": "NY.GDP.MKTP.CD", "entity_type": "EconomicIndicator", "label_prefix": "GDP", "unit": "USD"},
    {"code": "SL.UEM.TOTL.ZS", "entity_type": "UnemploymentRate", "label_prefix": "Unemployment", "unit": "%"},
    {"code": "FP.CPI.TOTL.ZG", "entity_type": "InflationRate", "label_prefix": "Inflation", "unit": "%"},
    {"code": "AG.PRD.FOOD.XD", "entity_type": "FoodProductionIndex", "label_prefix": "Food Production", "unit": "index"},
    {"code": "SI.POV.GINI", "entity_type": "InequalityIndex", "label_prefix": "GINI Inequality", "unit": "index"},
]

REQUEST_CONCURRENCY = 25
REQUEST_TIMEOUT = httpx.Timeout(20.0, connect=8.0)

class WorldBankIngester(BaseIngester):
    domain = "economy"
    source_name = "World Bank Open Data"

    async def fetch(self) -> list[dict]:
        countries = await load_world_bank_countries()
        jobs = [(country, indicator) for country in countries for indicator in WB_INDICATORS]
        completed = 0
        lock = asyncio.Lock()
        semaphore = asyncio.Semaphore(REQUEST_CONCURRENCY)

        async def fetch_indicator(client: httpx.AsyncClient, country: dict, indicator: dict) -> list[dict]:
            nonlocal completed
            url = (
                f"https://api.worldbank.org/v2/country/{country['code']}"
                f"/indicator/{indicator['code']}?format=json&mrv=5&per_page=5"
            )
            try:
                async with semaphore:
                    resp = await client.get(url)
                    resp.raise_for_status()
                    data = resp.json()
                rows = data[1] if isinstance(data, list) and len(data) > 1 else []
                for row in rows:
                    row["_country"] = country
                    row["_indicator"] = indicator
                return rows
            except Exception as exc:
                return [{"_error": str(exc), "_country": country, "_indicator": indicator}]
            finally:
                async with lock:
                    completed += 1
                    if completed == 1 or completed % 50 == 0 or completed == len(jobs):
                        logger.info(f"[{self.source_name}] Fetched {completed}/{len(jobs)} country-indicator requests")

        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT, follow_redirects=True) as client:
            batches = await asyncio.gather(
                *(fetch_indicator(client, country, indicator) for country, indicator in jobs)
            )

        results = []
        for batch in batches:
            results.extend(batch)
        return results

    def transform(self, raw: list[dict]) -> list[ETLNode]:
        nodes: list[ETLNode] = []
        seen: set[str] = set()
        for row in raw:
            if "_error" in row or row.get("value") is None:
                continue
            country = row.get("_country", {})
            indicator = row.get("_indicator", {})
            year = row.get("date", "")
            value = row.get("value")
            cc = country.get("code", "")
            node_id = f"economy_{indicator['entity_type'].lower()}_{cc}_{year}"
            if node_id in seen:
                continue
            seen.add(node_id)
            if indicator["code"] == "SL.UEM.TOTL.ZS":
                severity = min(10.0, float(value) / 3)
            elif indicator["code"] == "FP.CPI.TOTL.ZG":
                severity = min(10.0, max(0.0, float(value) / 5))
            elif indicator["code"] == "AG.PRD.FOOD.XD":
                severity = max(0.0, 10.0 - float(value) / 20)
            else:
                severity = 5.0
            nodes.append(ETLNode(
                id=node_id,
                domain="economy",
                entity_type=indicator["entity_type"],
                label=f"{indicator['label_prefix']} — {cc} {year}",
                lat=country.get("latitude"),
                lon=country.get("longitude"),
                country_code=cc,
                valid_from=f"{year}-01-01",
                valid_to=f"{year}-12-31",
                source=self.source_name,
                severity=round(severity, 2),
                properties={
                    "value": float(value),
                    "unit": indicator["unit"],
                    "country": cc,
                    "year": year,
                    "indicator_code": indicator["code"],
                    "price_index_change": float(value) if indicator["code"] == "FP.CPI.TOTL.ZG" else 0,
                },
            ))
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
