import httpx
from etl.base import BaseIngester
from etl.ingesters.common import COUNTRY_COORDS, load_country_catalog
from models.graph import ETLNode, ETLEdge
from graph.edge_rules import run_edge_rules

HDI_INDICATOR = "HD.HCI.OVRL"
LIFE_EXP_INDICATOR = "SP.DYN.LE00.IN"
GNI_INDICATOR = "NY.GNP.PCAP.PP.CD"

class UNDPHDIIngester(BaseIngester):
    domain = "social"
    source_name = "UNDP HDI"

    async def fetch(self) -> list[dict]:
        results = []
        codes = [country["code"] for country in await load_country_catalog()]
        async with httpx.AsyncClient(timeout=30) as client:
            for indicator in [LIFE_EXP_INDICATOR, GNI_INDICATOR]:
                for index in range(0, len(codes), 40):
                    country_str = ";".join(codes[index:index + 40])
                    url = (
                        f"https://api.worldbank.org/v2/country/{country_str}"
                        f"/indicator/{indicator}?format=json&mrv=5&per_page=400"
                    )
                    try:
                        resp = await client.get(url)
                        resp.raise_for_status()
                        data = resp.json()
                        rows = data[1] if len(data) > 1 else []
                        for row in rows:
                            row["_indicator"] = indicator
                        results.extend(rows)
                    except Exception as exc:
                        results.append({"_error": str(exc)})
        return results

    def transform(self, raw: list[dict]) -> list[ETLNode]:
        nodes: list[ETLNode] = []
        seen: set[str] = set()
        for row in raw:
            if "_error" in row or row.get("value") is None:
                continue
            cc = row.get("countryiso3code", "")
            year = row.get("date", "")
            value = row.get("value")
            indicator = row.get("_indicator", "")
            if cc not in COUNTRY_COORDS:
                continue
            entity_type = "LifeExpectancyIndex" if indicator == LIFE_EXP_INDICATOR else "HDIScore"
            node_id = f"social_{entity_type.lower()}_{cc}_{year}"
            if node_id in seen:
                continue
            seen.add(node_id)
            coords = COUNTRY_COORDS[cc]
            try:
                val = float(value)
            except (ValueError, TypeError):
                continue
            if indicator == LIFE_EXP_INDICATOR:
                severity = max(0.0, 10.0 - (val - 40) / 5)
            else:
                severity = max(0.0, 10.0 - val / 5000)
            nodes.append(ETLNode(
                id=node_id,
                domain="social",
                entity_type=entity_type,
                label=f"{'Life Expectancy' if indicator == LIFE_EXP_INDICATOR else 'GNI per Capita'} — {cc} {year}",
                lat=coords[0],
                lon=coords[1],
                country_code=cc,
                valid_from=f"{year}-01-01",
                valid_to=f"{year}-12-31",
                source=self.source_name,
                severity=round(severity, 2),
                properties={
                    "value": val,
                    "indicator": indicator,
                    "country": cc,
                    "year": year,
                    "hdi_value": val / 100 if indicator == LIFE_EXP_INDICATOR else val / 50000,
                },
            ))
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
