from fastapi import APIRouter
from loguru import logger
from db.supabase_client import get_supabase

router = APIRouter()

@router.get("/active")
async def api_active_alerts():
    try:
        client = get_supabase()
        result = (
            client.table("alert_events")
            .select("*")
            .in_("severity", ["high", "critical"])
            .order("fired_at", desc=True)
            .limit(20)
            .execute()
        )
        return {"alerts": result.data or []}
    except Exception as exc:
        logger.warning(f"Active alerts query failed: {exc}")
        return {"alerts": []}
