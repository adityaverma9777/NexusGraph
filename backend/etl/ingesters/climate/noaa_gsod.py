import httpx
import io
import csv
from etl.base import BaseIngester
from models.graph import ETLNode, ETLEdge
from graph.edge_rules import run_edge_rules
from config import get_settings

STATIONS = [
    {"id": "724940", "name": "Los Angeles", "country": "USA", "lat": 33.938, "lon": -118.389},
    {"id": "432950", "name": "Mumbai", "country": "IND", "lat": 19.076, "lon": 72.877},
    {"id": "432760", "name": "Delhi", "country": "IND", "lat": 28.704, "lon": 77.102},
    {"id": "636400", "name": "Nairobi", "country": "KEN", "lat": -1.286, "lon": 36.817},
    {"id": "637400", "name": "Lagos", "country": "NGA", "lat": 6.524, "lon": 3.379},
    {"id": "485500", "name": "Jakarta", "country": "IDN", "lat": -6.175, "lon": 106.827},
    {"id": "838480", "name": "Sydney", "country": "AUS", "lat": -33.869, "lon": 151.209},
    {"id": "724720", "name": "Phoenix", "country": "USA", "lat": 33.434, "lon": -112.008},
    {"id": "271450", "name": "Moscow", "country": "RUS", "lat": 55.755, "lon": 37.617},
    {"id": "517820", "name": "Beijing", "country": "CHN", "lat": 39.904, "lon": 116.391},
]

class NOAAGSODIngester(BaseIngester):
    domain = "climate"
    source_name = "NOAA GSOD"

    async def fetch(self) -> list[dict]:
        settings = get_settings()
        token = settings.data_gov_in_api_key or ""
        results = []
        async with httpx.AsyncClient(timeout=30) as client:
            for station in STATIONS:
                url = (
                    "https://www.ncei.noaa.gov/access/services/data/v1"
                    f"?dataset=global-summary-of-the-day&stations={station['id']}"
                    "&startDate=2023-01-01&endDate=2024-01-01"
                    "&dataTypes=TEMP,PRCP,WDSP&format=json&units=metric"
                )
                headers = {"token": token} if token else {}
                try:
                    resp = await client.get(url, headers=headers)
                    if resp.status_code == 200:
                        for row in resp.json():
                            row["_station"] = station
                        results.extend(resp.json())
                    else:
                        results.append({"_station": station, "_error": f"HTTP {resp.status_code}"})
                except Exception as exc:
                    results.append({"_station": station, "_error": str(exc)})
        return results

    def transform(self, raw: list[dict]) -> list[ETLNode]:
        nodes: list[ETLNode] = []
        station_data: dict[str, list] = {}
        for row in raw:
            if "_error" in row:
                continue
            station = row.get("_station", {})
            key = station.get("id", "")
            station_data.setdefault(key, []).append(row)
        for key, records in station_data.items():
            if not records:
                continue
            station = records[0].get("_station", {})
            temps = [float(r["TEMP"]) for r in records if r.get("TEMP") not in (None, "9999.9", "")]
            precips = [float(r["PRCP"]) for r in records if r.get("PRCP") not in (None, "99.99", "")]
            if not temps:
                continue
            avg_temp = sum(temps) / len(temps)
            baseline_temp = 22.0
            anomaly_pct = (avg_temp - baseline_temp) / baseline_temp * 100
            severity = min(10.0, max(0.0, 5.0 + abs(anomaly_pct) / 10))
            node_id = f"climate_temp_{station.get('country', '')}_{key}_2023"
            nodes.append(ETLNode(
                id=node_id,
                domain="climate",
                entity_type="TemperatureRecord",
                label=f"Temperature Anomaly — {station.get('name', key)}",
                lat=station.get("lat"),
                lon=station.get("lon"),
                valid_from="2023-01-01",
                valid_to="2024-01-01",
                source=self.source_name,
                severity=round(severity, 2),
                properties={
                    "avg_temp_c": round(avg_temp, 2),
                    "anomaly_pct": round(anomaly_pct, 2),
                    "avg_precip_mm": round(sum(precips) / len(precips), 2) if precips else 0,
                    "country": station.get("country", ""),
                    "station_id": key,
                    "record_count": len(records),
                },
            ))
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
