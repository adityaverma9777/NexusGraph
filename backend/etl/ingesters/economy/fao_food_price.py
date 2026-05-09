import httpx
from etl.base import BaseIngester
from models.graph import ETLNode, ETLEdge
from graph.edge_rules import run_edge_rules

FAO_ITEMS = [
    {"code": "2905", "name": "Cereal Price Index"},
    {"code": "2907", "name": "Dairy Price Index"},
    {"code": "2908", "name": "Meat Price Index"},
    {"code": "2909", "name": "Sugar Price Index"},
    {"code": "2906", "name": "Oils Price Index"},
]

REGION_COORDS: dict[str, tuple[float, float]] = {
    "World": (20.0, 0.0), "Asia": (34.0, 100.0),
    "Africa": (8.0, 20.0), "Europe": (54.0, 15.0),
    "Americas": (10.0, -80.0),
}

class FAOFoodPriceIngester(BaseIngester):
    domain = "economy"
    source_name = "FAO Food Price Index"

    async def fetch(self) -> list[dict]:
        results = []
        async with httpx.AsyncClient(timeout=30) as client:
            for item in FAO_ITEMS:
                url = (
                    "http://fenixservices.fao.org/faostat/api/v1/en/data/CP"
                    f"?area=1&element=6&item={item['code']}"
                    "&year=2015,2016,2017,2018,2019,2020,2021,2022,2023&output_type=objects"
                )
                try:
                    resp = await client.get(url)
                    resp.raise_for_status()
                    data = resp.json()
                    for row in data.get("data", []):
                        row["_item"] = item
                    results.extend(data.get("data", []))
                except Exception as exc:
                    results.append({"_error": str(exc), "_item": item})
        return results

    def transform(self, raw: list[dict]) -> list[ETLNode]:
        nodes: list[ETLNode] = []
        seen: set[str] = set()
        prev_values: dict[str, float] = {}
        for row in sorted(raw, key=lambda r: r.get("Year", 0)):
            if "_error" in row:
                continue
            item = row.get("_item", {})
            year = row.get("Year", 0)
            value = row.get("Value")
            if value is None:
                continue
            try:
                value = float(value)
            except (ValueError, TypeError):
                continue
            key = item.get("code", "")
            prev = prev_values.get(key, value)
            change_pct = (value - prev) / prev * 100 if prev else 0
            prev_values[key] = value
            node_id = f"economy_foodprice_{key}_{year}"
            if node_id in seen:
                continue
            seen.add(node_id)
            severity = min(10.0, max(0.0, abs(change_pct) / 5))
            nodes.append(ETLNode(
                id=node_id,
                domain="economy",
                entity_type="FoodPriceEvent",
                label=f"{item.get('name', 'Food Price')} — {year}",
                lat=REGION_COORDS["World"][0],
                lon=REGION_COORDS["World"][1],
                valid_from=f"{year}-01-01",
                valid_to=f"{year}-12-31",
                source=self.source_name,
                severity=round(severity, 2),
                properties={
                    "price_index": value,
                    "price_index_change": round(change_pct, 2),
                    "item": item.get("name", ""),
                    "year": year,
                    "country": "World",
                },
            ))
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
