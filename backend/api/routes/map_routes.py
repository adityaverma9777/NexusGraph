from fastapi import APIRouter, Query
from db.supabase_client import get_supabase

router = APIRouter()

@router.get("/heatmap")
async def api_heatmap(
    layer: str = Query(...),
    date: str = Query(default=None),
    bbox: str = Query(default=None),
):
    client = get_supabase()
    entity_type_map = {
        "disease_dengue": "DengueOutbreak",
        "disease_malaria": "MalariaOutbreak",
        "climate_rainfall": "RainfallAnomaly",
        "ecology_deforestation": "DeforestationEvent",
        "ecology_wildfire": "WildfireEvent",
        "population_displacement": "DisplacementEvent",
        "economy_food_price": "FoodPriceEvent",
        "infrastructure_conflict": "ConflictEvent",
    }
    entity_type = entity_type_map.get(layer, layer)
    query = (
        client.table("metrics")
        .select("lat,lon,metric_value")
        .eq("entity_type", entity_type)
        .not_.is_("lat", "null")
        .not_.is_("lon", "null")
        .not_.is_("metric_value", "null")
    )
    if date:
        query = query.lte("valid_from", date)
    result = query.limit(2000).execute()
    rows = result.data or []
    if not rows:
        return {"points": []}
    max_val = max((r["metric_value"] for r in rows), default=10)
    min_val = min((r["metric_value"] for r in rows), default=0)
    span = max_val - min_val or 1
    points = [
        [r["lat"], r["lon"], round((r["metric_value"] - min_val) / span, 3)]
        for r in rows
        if r["lat"] and r["lon"]
    ]
    return {"points": points, "count": len(points), "layer": layer}

@router.get("/layers")
async def api_layers():
    return {
        "layers": [
            {"id": "disease_dengue", "label": "Dengue Risk", "color": "#ef233c", "domain": "disease"},
            {"id": "disease_malaria", "label": "Malaria Risk", "color": "#c77dff", "domain": "disease"},
            {"id": "climate_rainfall", "label": "Rainfall Anomaly", "color": "#00b4d8", "domain": "climate"},
            {"id": "ecology_deforestation", "label": "Deforestation", "color": "#52b788", "domain": "ecology"},
            {"id": "ecology_wildfire", "label": "Active Wildfires", "color": "#ff6b35", "domain": "ecology"},
            {"id": "population_displacement", "label": "Displacement Events", "color": "#a8dadc", "domain": "population"},
            {"id": "economy_food_price", "label": "Food Price Stress", "color": "#f4a261", "domain": "economy"},
            {"id": "infrastructure_conflict", "label": "Conflict Events", "color": "#c77dff", "domain": "infrastructure"},
        ]
    }

@router.get("/overlay")
async def api_overlay(
    layers: str = Query(...),
    date: str = Query(default=None),
):
    layer_list = [l.strip() for l in layers.split(",")]
    entity_type_map = {
        "disease_dengue": "DengueOutbreak",
        "disease_malaria": "MalariaOutbreak",
        "climate_rainfall": "RainfallAnomaly",
        "ecology_deforestation": "DeforestationEvent",
        "ecology_wildfire": "WildfireEvent",
        "population_displacement": "DisplacementEvent",
        "economy_food_price": "FoodPriceEvent",
        "infrastructure_conflict": "ConflictEvent",
    }
    client = get_supabase()
    entity_types = [entity_type_map.get(l, l) for l in layer_list]
    query = (
        client.table("metrics")
        .select("entity_id,entity_type,lat,lon,metric_value,valid_from,properties")
        .in_("entity_type", entity_types)
        .not_.is_("lat", "null")
        .not_.is_("lon", "null")
    )
    if date:
        query = query.lte("valid_from", date)
    result = query.limit(1000).execute()
    rows = result.data or []
    items = [
        {
            "id": r["entity_id"],
            "position": [r["lat"], r["lon"]],
            "label": r["entity_type"].replace("_", " "),
            "properties": r.get("properties") or {},
        }
        for r in rows
        if r.get("lat") and r.get("lon")
    ]
    return {"items": items, "count": len(items)}
