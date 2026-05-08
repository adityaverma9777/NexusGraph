from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_key: str = ""
    neo4j_uri: str = ""
    neo4j_username: str = "neo4j"
    neo4j_password: str = ""
    upstash_redis_url: str = ""
    upstash_redis_token: str = ""
    groq_api_key: str = ""
    data_gov_in_api_key: str = ""
    openaq_api_key: str = ""
    nasa_earthdata_token: str = ""
    iucn_api_token: str = ""
    acled_api_key: str = ""
    sentry_dsn: str = ""
    environment: str = "development"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:5174", "https://nexusgraph.vercel.app"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

@lru_cache
def get_settings() -> Settings:
    return Settings()
