from supabase import create_client, Client
from loguru import logger
from config import get_settings

_client: Client | None = None

def init_supabase() -> None:
    global _client
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_key:
        logger.warning("Supabase credentials not set — DB calls will fail")
        return
    _client = create_client(settings.supabase_url, settings.supabase_service_key)
    logger.info("Supabase client initialised")

def get_supabase() -> Client:
    if _client is None:
        raise RuntimeError("Supabase not initialised. Call init_supabase() first.")
    return _client
