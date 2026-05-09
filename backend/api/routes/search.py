from fastapi import APIRouter, Query
from graph.traversal import search_entities, search_graph
from models.graph import GraphNode, GraphPayload

router = APIRouter()

@router.get("", response_model=list[GraphNode])
async def api_search(
    q: str = Query(..., min_length=2),
    domain: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
):
    return await search_entities(q=q, domain=domain, limit=limit)

@router.get("/graph", response_model=GraphPayload)
async def api_search_graph(
    q: str = Query(..., min_length=2),
    domain: str | None = Query(default=None),
    limit: int = Query(default=12, ge=1, le=30),
    min_confidence: float = Query(default=0.4, ge=0.0, le=1.0),
    as_of: str | None = Query(default=None),
):
    return await search_graph(q=q, domain=domain, limit=limit, min_confidence=min_confidence, as_of=as_of)
