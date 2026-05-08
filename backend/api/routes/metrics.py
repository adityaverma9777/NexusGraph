from fastapi import APIRouter, Query
from db.supabase_client import get_supabase
from models.metrics import TimeSeriesPoint

router = APIRouter()

@router.get("/timeseries", response_model=list[TimeSeriesPoint])
async def api_timeseries(
    entity_type: str = Query(...),
    country: str = Query(...),
    from_date: str = Query(default="2015-01-01", alias="from"),
    to_date: str = Query(default="2024-12-31", alias="to"),
):
    client = get_supabase()
    result = (
        client.table("metrics")
        .select("valid_from, metric_value, entity_id, entity_type, country_code")
        .eq("entity_type", entity_type)
        .eq("country_code", country)
        .gte("valid_from", from_date)
        .lte("valid_from", to_date)
        .order("valid_from")
        .limit(500)
        .execute()
    )
    rows = result.data or []
    return [
        TimeSeriesPoint(
            date=r["valid_from"],
            value=float(r["metric_value"] or 0),
            entity_id=r["entity_id"],
            entity_type=r["entity_type"],
            country_code=r.get("country_code"),
        )
        for r in rows
        if r.get("metric_value") is not None
    ]
