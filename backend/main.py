import sys
import os
from pathlib import Path

# Force the backend directory into sys.path to ensure module resolution works correctly on Render
backend_dir = str(Path(__file__).parent.absolute())
print(f"DEBUG: CWD is {os.getcwd()}")
print(f"DEBUG: backend_dir is {backend_dir}")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
print(f"DEBUG: sys.path is {sys.path}")

from contextlib import asynccontextmanager
try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from loguru import logger
    from config import get_settings
    from api.routes import (
        graph as graph_router,
        metrics as metrics_router,
        map_routes as map_router,
        intelligence as intelligence_router,
        search as search_router,
        alerts as alerts_router
    )
    from db.supabase_client import init_supabase
    from graph.neo4j_client import neo4j_client
except Exception as e:
    print(f"CRITICAL: Import failure at top level: {e}")
    sys.exit(1)

try:
    settings = get_settings()
except Exception as e:
    print(f"CRITICAL: Settings loading failed: {e}")
    sys.exit(1)

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

allowed_origins = sorted({*(settings.get_cors_origins or []), *LOCAL_CORS_ORIGINS})

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(graph_router.router, prefix="/api/graph", tags=["graph"])
app.include_router(metrics_router.router, prefix="/api/metrics", tags=["metrics"])
app.include_router(map_router.router, prefix="/api/map", tags=["map"])
app.include_router(intelligence_router.router, prefix="/api/intelligence", tags=["intelligence"])
app.include_router(search_router.router, prefix="/api/search", tags=["search"])
app.include_router(alerts_router.router, prefix="/api/alerts", tags=["alerts"])

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
