from fastapi import APIRouter, Query
from db.supabase_client import get_supabase
from graph.neo4j_client import neo4j_client

router = APIRouter()

ENTITY_TYPE_MAP = {
    "disease_dengue": "DengueOutbreak",
    "disease_malaria": "MalariaOutbreak",
    "disease_covid": "PandemicEvent",
    "disease_air": "AirPollutionEvent",
    "climate_rainfall": "RainfallAnomaly",
    "climate_temp": "TemperatureRecord",
    "ecology_deforestation": "DeforestationEvent",
    "ecology_wildfire": "WildfireEvent",
    "population_displacement": "DisplacementEvent",
    "economy_food_price": "FoodPriceEvent",
    "economy_crop": "CropYieldAnomaly",
    "infrastructure_conflict": "ConflictEvent",
    "social_hdi": "LifeExpectancyIndex",
}


def _active_expr(alias: str) -> str:
    return f"($as_of IS NULL OR (({alias}.valid_from IS NULL OR {alias}.valid_from <= $as_of) AND ({alias}.valid_to IS NULL OR {alias}.valid_to >= $as_of)))"


async def _relationship_summary(entity_id: str, as_of: str | None) -> dict:
    if not neo4j_client.is_connected:
        return {"relationship_count": 0, "relationships": []}

    query = f"""
    MATCH (n {{id: $entity_id}})-[r]-(m)
    WHERE {_active_expr('n')}
      AND {_active_expr('m')}
    RETURN count(r) AS relationship_count,
           collect(DISTINCT {{
             relationship: type(r),
             peer_id: m.id,
             peer_label: coalesce(m.label, m.id, ''),
             confidence: coalesce(r.confidence, 0.5)
           }})[0..3] AS relationships
    """
    row = await neo4j_client.run_single(query, entity_id=entity_id, as_of=as_of)
    if not row:
        return {"relationship_count": 0, "relationships": []}
    relationships = row.get("relationships") or []
    if not isinstance(relationships, list):
        relationships = []
    return {
        "relationship_count": int(row.get("relationship_count") or 0),
        "relationships": relationships,
    }

@router.get("/heatmap")
async def api_heatmap(
    layer: str = Query(...),
    date: str = Query(default=None),
    bbox: str = Query(default=None),
):
    client = get_supabase()
    entity_type = ENTITY_TYPE_MAP.get(layer, layer)
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
    if bbox:
        try:
            min_lon, min_lat, max_lon, max_lat = [float(v) for v in bbox.split(",")]
            query = query.gte("lat", min_lat).lte("lat", max_lat).gte("lon", min_lon).lte("lon", max_lon)
        except (ValueError, TypeError):
            pass
    result = query.limit(2000).execute()
    rows = result.data or []
    if not rows:
        return {"points": [], "count": 0, "layer": layer}
    max_val = max((r["metric_value"] for r in rows), default=10)
    min_val = min((r["metric_value"] for r in rows), default=0)
    span = max_val - min_val or 1
    points = [
        [r["lat"], r["lon"], round((r["metric_value"] - min_val) / span, 3)]
        for r in rows
        if r["lat"] is not None and r["lon"] is not None
    ]
    return {"points": points, "count": len(points), "layer": layer}

@router.get("/layers")
async def api_layers():
    return {
        "layers": [
            {"id": "disease_dengue", "label": "Dengue Risk", "color": "#ef233c", "domain": "disease"},
            {"id": "disease_malaria", "label": "Malaria Risk", "color": "#c77dff", "domain": "disease"},
            {"id": "disease_covid", "label": "Pandemic Events", "color": "#ff006e", "domain": "disease"},
            {"id": "disease_air", "label": "Air Pollution (PM2.5)", "color": "#9d4edd", "domain": "disease"},
            {"id": "climate_rainfall", "label": "Rainfall Anomaly", "color": "#00b4d8", "domain": "climate"},
            {"id": "climate_temp", "label": "Temperature Anomaly", "color": "#f77f00", "domain": "climate"},
            {"id": "ecology_deforestation", "label": "Deforestation", "color": "#52b788", "domain": "ecology"},
            {"id": "ecology_wildfire", "label": "Active Wildfires", "color": "#ff6b35", "domain": "ecology"},
            {"id": "population_displacement", "label": "Displacement Events", "color": "#a8dadc", "domain": "population"},
            {"id": "economy_food_price", "label": "Food Price Stress", "color": "#f4a261", "domain": "economy"},
            {"id": "economy_crop", "label": "Crop Yield Anomaly", "color": "#d4a017", "domain": "agriculture"},
            {"id": "infrastructure_conflict", "label": "Conflict Events", "color": "#e63946", "domain": "infrastructure"},
            {"id": "social_hdi", "label": "Human Development", "color": "#74c0fc", "domain": "social"},
        ]
    }

@router.get("/overlay")
async def api_overlay(
    layers: str = Query(...),
    date: str = Query(default=None),
):
    layer_list = [ll.strip() for ll in layers.split(",")]
    client = get_supabase()
    entity_types = [ENTITY_TYPE_MAP.get(ll, ll) for ll in layer_list]
    query = (
        client.table("metrics")
        .select("entity_id,entity_type,domain,lat,lon,metric_value,valid_from,properties")
        .in_("entity_type", entity_types)
        .not_.is_("lat", "null")
        .not_.is_("lon", "null")
    )
    if date:
        query = query.lte("valid_from", date)
    result = query.limit(1000).execute()
    rows = result.data or []
    items = []
    for r in rows:
        if r.get("lat") is None or r.get("lon") is None:
            continue
        entity_id = r["entity_id"]
        summary = await _relationship_summary(entity_id, date)
        properties = r.get("properties") or {}
        if not isinstance(properties, dict):
          properties = {}
        items.append(
            {
                "id": entity_id,
                "position": [r["lat"], r["lon"]],
                "label": r["entity_type"].replace("_", " "),
                "domain": r.get("domain", ""),
                "entity_type": r["entity_type"],
                "severity": r.get("metric_value"),
                "relationship_count": summary["relationship_count"],
                "relationships": summary["relationships"],
                "properties": properties,
            }
        )
    return {"items": items, "count": len(items)}

@router.get("/spatial-query")
async def api_spatial_query(
    lat: float = Query(...),
    lon: float = Query(...),
    radius_km: float = Query(default=50.0, ge=1.0, le=500.0),
    as_of: str = Query(default=None),
):
    client = get_supabase()
    lat_delta = radius_km / 111.0
    lon_delta = radius_km / (111.0 * abs(float(f"{lat:.4f}") or 1) * 0.01745 + 0.001)
    query = (
        client.table("metrics")
        .select("entity_id,entity_type,domain,lat,lon,metric_value,valid_from,source_dataset,properties")
        .gte("lat", lat - lat_delta)
        .lte("lat", lat + lat_delta)
        .gte("lon", lon - lon_delta)
        .lte("lon", lon + lon_delta)
        .not_.is_("metric_value", "null")
    )
    if as_of:
        query = query.lte("valid_from", as_of)
    result = query.order("metric_value", desc=True).limit(20).execute()
    rows = result.data or []
    entity_ids = [r["entity_id"] for r in rows if r.get("entity_id")]
    return {
        "entities": [
            {
                "id": r["entity_id"],
                "entity_type": r["entity_type"],
                "domain": r.get("domain", ""),
                "lat": r["lat"],
                "lon": r["lon"],
                "severity": r["metric_value"],
                "valid_from": r["valid_from"],
                "source": r.get("source_dataset", ""),
                "properties": r.get("properties") or {},
            }
            for r in rows
        ],
        "entity_ids": entity_ids,
        "center": {"lat": lat, "lon": lon},
        "radius_km": radius_km,
        "count": len(rows),
    }
