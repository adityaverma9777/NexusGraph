from etl.base import BaseIngester
from etl.ingesters.common import COUNTRY_COORDS, clamp, load_country_catalog, stable_range, year_bounds
from graph.edge_rules import run_edge_rules
from models.graph import ETLEdge, ETLNode

ERA5_ROWS = [
    {"country": "IND", "year": 2024, "temp_anomaly_pct": 14.8, "soil_moisture_pct": 28, "label": "India"},
    {"country": "PAK", "year": 2024, "temp_anomaly_pct": 18.5, "soil_moisture_pct": 16, "label": "Pakistan"},
    {"country": "BGD", "year": 2024, "temp_anomaly_pct": 11.2, "soil_moisture_pct": 35, "label": "Bangladesh"},
    {"country": "ETH", "year": 2024, "temp_anomaly_pct": 16.1, "soil_moisture_pct": 14, "label": "Ethiopia"},
    {"country": "KEN", "year": 2024, "temp_anomaly_pct": 9.4, "soil_moisture_pct": 22, "label": "Kenya"},
    {"country": "BRA", "year": 2024, "temp_anomaly_pct": 13.7, "soil_moisture_pct": 19, "label": "Brazil"},
    {"country": "IDN", "year": 2024, "temp_anomaly_pct": 7.2, "soil_moisture_pct": 41, "label": "Indonesia"},
]


class ERA5ReanalysisIngester(BaseIngester):
    domain = "climate"
    source_name = "ERA5 Reanalysis"

    async def fetch(self) -> list[dict]:
        return [
            {
                "country": country["code"],
                "year": 2024,
                "temp_anomaly_pct": round(stable_range(3.0, 21.0, country["code"], "era5_temp"), 2),
                "soil_moisture_pct": round(stable_range(10.0, 58.0, country["code"], "era5_soil"), 2),
                "label": country["name"],
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
            year = int(row.get("year", 2024))
            start, end = year_bounds(year)
            temp_anomaly_pct = float(row.get("temp_anomaly_pct", 0))
            soil_moisture_pct = float(row.get("soil_moisture_pct", 0))
            label = str(row.get("label", country))
            nodes.append(
                ETLNode(
                    id=f"climate_era5_temperature_{country}_{year}",
                    domain=self.domain,
                    entity_type="TemperatureRecord",
                    label=f"ERA5 Temperature Anomaly - {label} {year}",
                    lat=lat,
                    lon=lon,
                    country_code=country,
                    valid_from=start,
                    valid_to=end,
                    source=self.source_name,
                    severity=round(clamp(4.0 + temp_anomaly_pct / 2), 2),
                    properties={
                        "country": country,
                        "anomaly_pct": round(temp_anomaly_pct, 2),
                        "soil_moisture_pct": round(soil_moisture_pct, 2),
                    },
                )
            )
            if soil_moisture_pct < 25:
                nodes.append(
                    ETLNode(
                        id=f"climate_era5_drought_{country}_{year}",
                        domain=self.domain,
                        entity_type="DroughtEvent",
                        label=f"ERA5 Soil Moisture Stress - {label} {year}",
                        lat=lat,
                        lon=lon,
                        country_code=country,
                        valid_from=start,
                        valid_to=end,
                        source=self.source_name,
                        severity=round(clamp((30 - soil_moisture_pct) / 2), 2),
                        properties={
                            "country": country,
                            "severity": round((30 - soil_moisture_pct) / 2, 2),
                            "soil_moisture_pct": round(soil_moisture_pct, 2),
                        },
                    )
                )
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
