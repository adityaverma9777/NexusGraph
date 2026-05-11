from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from config import get_settings
from api.routes import graph, metrics, map_routes, intelligence, search, alerts
from db.supabase_client import init_supabase
from graph.neo4j_client import neo4j_client

settings = get_settings()

LOCAL_CORS_ORIGINS = {
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
}

if settings.sentry_dsn:
    import sentry_sdk
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        traces_sample_rate=0.1,
    )
    logger.info("Sentry error tracking enabled")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting NexusGraph API")
    init_supabase()
    await neo4j_client.connect()
    yield
    await neo4j_client.close()
    logger.info("NexusGraph API shut down")

app = FastAPI(
    title="NexusGraph API",
    description="Multi-domain open intelligence relationship engine",
    version="1.0.0",
    lifespan=lifespan,
)

allowed_origins = sorted({*(settings.cors_origins or []), *LOCAL_CORS_ORIGINS})

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(graph.router, prefix="/api/graph", tags=["graph"])
app.include_router(metrics.router, prefix="/api/metrics", tags=["metrics"])
app.include_router(map_routes.router, prefix="/api/map", tags=["map"])
app.include_router(intelligence.router, prefix="/api/intelligence", tags=["intelligence"])
app.include_router(search.router, prefix="/api/search", tags=["search"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["alerts"])

@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}

@app.get("/api/datasets/registry")
async def datasets_registry():
    from db.supabase_client import get_supabase
    import os
    from pathlib import Path
    
    client = get_supabase()
    result = client.table("dataset_registry").select("*").order("domain").execute()
    data = result.data or []
    
    base_dir = Path(__file__).parent.parent
    kaggle_dir = base_dir / "data" / "kaggle_raw"
    
    if kaggle_dir.exists():
        for csv_file in kaggle_dir.rglob("*.csv"):
            rel_path = csv_file.relative_to(kaggle_dir)
            domain = rel_path.parts[0] if len(rel_path.parts) > 1 else "general"
            data.append({
                "dataset_name": csv_file.name,
                "domain": domain,
                "source_url": "Kaggle Raw",
                "update_frequency": "Static"
            })
            
    return {"datasets": data}
