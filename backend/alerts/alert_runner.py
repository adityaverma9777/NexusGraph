import asyncio
from datetime import date, timedelta
from loguru import logger
from db.supabase_client import get_supabase, init_supabase

ALERT_THRESHOLDS = [
    {
        "id": "dengue_high_rainfall",
        "description": "Dengue risk: high rainfall anomaly + recent dengue cases in same region",
        "entity_types": ["DengueOutbreak", "RainfallAnomaly"],
        "min_severity": 6.5,
        "alert_type": "disease_climate_compound",
        "severity_level": "high",
        "title_template": "Elevated dengue risk — rainfall anomaly detected in {country}",
        "desc_template": "Rainfall anomaly co-occurring with dengue activity in {country}. Historical 2-week lag suggests case spike risk.",
    },
    {
        "id": "conflict_displacement",
        "description": "Conflict + displacement compound crisis",
        "entity_types": ["ConflictEvent", "DisplacementEvent"],
        "min_severity": 7.0,
        "alert_type": "conflict_displacement",
        "severity_level": "high",
        "title_template": "Conflict-displacement compound crisis — {country}",
        "desc_template": "High-severity conflict activity correlating with displacement pressure in {country}.",
    },
    {
        "id": "food_price_spike",
        "description": "Food price index change exceeds 20% — food security alert",
        "entity_types": ["FoodPriceEvent"],
        "min_severity": 7.0,
        "alert_type": "food_security",
        "severity_level": "critical",
        "title_template": "Food price crisis — {country} price index spike",
        "desc_template": "Food price index exceeds 20% year-on-year change. Downstream poverty and displacement risk elevated.",
    },
    {
        "id": "wildfire_air_quality",
        "description": "Active wildfire + air pollution compound event",
        "entity_types": ["WildfireEvent", "AirPollutionEvent"],
        "min_severity": 6.0,
        "alert_type": "ecology_health_compound",
        "severity_level": "high",
        "title_template": "Wildfire air quality emergency — {country}",
        "desc_template": "Active wildfires co-occurring with high PM2.5 readings in same region.",
    },
    {
        "id": "malaria_displacement",
        "description": "Malaria outbreak + active displacement = health system collapse risk",
        "entity_types": ["MalariaOutbreak", "DisplacementEvent"],
        "min_severity": 6.5,
        "alert_type": "health_collapse",
        "severity_level": "critical",
        "title_template": "Health system collapse risk — malaria + displacement in {country}",
        "desc_template": "Malaria outbreak in a displacement-affected region signals compounding healthcare system stress.",
    },
]

async def check_and_write_alerts():
    init_supabase()
    client = get_supabase()
    as_of = str(date.today())
    fired: list[dict] = []
    for threshold in ALERT_THRESHOLDS:
        country_data: dict[str, dict] = {}
        for entity_type in threshold["entity_types"]:
            result = (
                client.table("metrics")
                .select("entity_type,country_code,metric_value,lat,lon")
                .eq("entity_type", entity_type)
                .gte("metric_value", threshold["min_severity"])
                .gte("valid_from", str(date.today() - timedelta(days=90)))
                .limit(100)
                .execute()
            )
            for row in result.data or []:
                cc = row.get("country_code", "GLOBAL")
                country_data.setdefault(cc, {"types": set(), "max_sev": 0})
                country_data[cc]["types"].add(entity_type)
                country_data[cc]["max_sev"] = max(country_data[cc]["max_sev"], float(row.get("metric_value", 0)))
        for cc, data in country_data.items():
            if len(data["types"]) >= len(threshold["entity_types"]):
                alert = {
                    "alert_type": threshold["alert_type"],
                    "severity": threshold["severity_level"],
                    "title": threshold["title_template"].format(country=cc),
                    "description": threshold["desc_template"].format(country=cc),
                    "affected_countries": [cc],
                    "related_entity_ids": [],
                }
                fired.append(alert)
                logger.info(f"Alert fired: {alert['title']}")
    if fired:
        client.table("alert_events").insert(fired).execute()
        logger.info(f"Wrote {len(fired)} alerts to Supabase")
    else:
        logger.info("No alert thresholds breached")
    return fired

if __name__ == "__main__":
    asyncio.run(check_and_write_alerts())
