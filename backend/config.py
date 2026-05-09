from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_key: str = ""
    neo4j_uri: str = ""
    neo4j_database: str = ""
    neo4j_username: str = "neo4j"
    neo4j_password: str = ""
    upstash_redis_url: str = ""
    upstash_redis_token: str = ""
    groq_api_key: str = ""
    groq_model: str = "llama-3.1-8b-instant"
    data_gov_in_api_key: str = ""
    openaq_api_key: str = ""
    nasa_earthdata_token: str = ""
    iucn_api_token: str = ""
    acled_api_key: str = ""
    acled_username: str = ""
    acled_password: str = ""
    sentry_dsn: str = ""
    environment: str = "development"
    free_tier_node_budget: int = 5000
    free_tier_edge_budget: int = 16000
    cross_domain_node_limit: int = 50000
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:5174", "https://nexusgraph.vercel.app"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

@lru_cache
def get_settings() -> Settings:
    return Settings()
