import httpx
from datetime import date, timedelta
from etl.base import BaseIngester
from models.graph import ETLNode, ETLEdge
from graph.edge_rules import run_edge_rules

LOCATIONS = [
    {"name": "Mumbai", "country": "IND", "lat": 19.076, "lon": 72.877, "admin1": "MH"},
    {"name": "Delhi", "country": "IND", "lat": 28.704, "lon": 77.102, "admin1": "DL"},
    {"name": "Chennai", "country": "IND", "lat": 13.083, "lon": 80.270, "admin1": "TN"},
    {"name": "Kolkata", "country": "IND", "lat": 22.573, "lon": 88.363, "admin1": "WB"},
    {"name": "Bengaluru", "country": "IND", "lat": 12.972, "lon": 77.594, "admin1": "KA"},
    {"name": "Hyderabad", "country": "IND", "lat": 17.385, "lon": 78.487, "admin1": "TS"},
    {"name": "Ahmedabad", "country": "IND", "lat": 23.033, "lon": 72.617, "admin1": "GJ"},
    {"name": "Jaipur", "country": "IND", "lat": 26.912, "lon": 75.787, "admin1": "RJ"},
    {"name": "Dhaka", "country": "BGD", "lat": 23.810, "lon": 90.412, "admin1": "DH"},
    {"name": "Karachi", "country": "PAK", "lat": 24.861, "lon": 67.010, "admin1": "SD"},
    {"name": "Colombo", "country": "LKA", "lat": 6.927, "lon": 79.861, "admin1": "WP"},
    {"name": "Nairobi", "country": "KEN", "lat": -1.286, "lon": 36.817, "admin1": "NA"},
    {"name": "Lagos", "country": "NGA", "lat": 6.524, "lon": 3.379, "admin1": "LA"},
    {"name": "Kinshasa", "country": "COD", "lat": -4.322, "lon": 15.322, "admin1": "KN"},
    {"name": "Jakarta", "country": "IDN", "lat": -6.175, "lon": 106.827, "admin1": "JK"},
    {"name": "Manila", "country": "PHL", "lat": 14.599, "lon": 120.984, "admin1": "MA"},
    {"name": "São Paulo", "country": "BRA", "lat": -23.550, "lon": -46.633, "admin1": "SP"},
    {"name": "Manaus", "country": "BRA", "lat": -3.119, "lon": -60.022, "admin1": "AM"},
    {"name": "Kabul", "country": "AFG", "lat": 34.528, "lon": 69.172, "admin1": "KA"},
    {"name": "Mogadishu", "country": "SOM", "lat": 2.046, "lon": 45.342, "admin1": "BN"},
]

class OpenMeteoIngester(BaseIngester):
    domain = "climate"
    source_name = "Open-Meteo Historical Weather"

    async def fetch(self) -> list[dict]:
        end = date.today() - timedelta(days=5)
        start = end - timedelta(days=365)
        results = []
        async with httpx.AsyncClient(timeout=30) as client:
            for loc in LOCATIONS:
                url = (
                    "https://archive-api.open-meteo.com/v1/archive"
                    f"?latitude={loc['lat']}&longitude={loc['lon']}"
                    f"&start_date={start}&end_date={end}"
                    "&daily=temperature_2m_max,precipitation_sum,et0_fao_evapotranspiration"
                    "&timezone=UTC"
                )
                try:
                    resp = await client.get(url)
                    resp.raise_for_status()
                    data = resp.json()
                    results.append({"location": loc, "data": data})
                except Exception as exc:
                    results.append({"location": loc, "error": str(exc)})
        return results

    def transform(self, raw: list[dict]) -> list[ETLNode]:
        nodes: list[ETLNode] = []
        for record in raw:
            loc = record["location"]
            data = record.get("data", {})
            daily = data.get("daily", {})
            dates = daily.get("time", [])
            precip = daily.get("precipitation_sum", [])
            if not dates:
                continue
            total_precip = sum(p for p in precip if p is not None)
            avg_precip = total_precip / len(dates) if dates else 0
            baseline_daily = 3.0
            anomaly_pct = ((avg_precip - baseline_daily) / baseline_daily * 100) if baseline_daily else 0
            severity = min(10.0, max(0.0, 5.0 + anomaly_pct / 20))
            node_id = f"climate_rainfall_{loc['country']}_{loc['admin1']}_{dates[0][:7] if dates else 'unknown'}"
            nodes.append(ETLNode(
                id=node_id,
                domain="climate",
                entity_type="RainfallAnomaly",
                label=f"Rainfall Anomaly — {loc['name']}",
                lat=loc["lat"],
                lon=loc["lon"],
                valid_from=dates[0] if dates else None,
                valid_to=dates[-1] if dates else None,
                source=self.source_name,
                severity=severity,
                properties={
                    "anomaly_pct": round(anomaly_pct, 2),
                    "avg_daily_precip_mm": round(avg_precip, 2),
                    "country": loc["country"],
                    "city": loc["name"],
                    "data_points": len(dates),
                },
            ))
        return nodes

    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        return run_edge_rules(nodes)
