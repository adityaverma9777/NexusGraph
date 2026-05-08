from fastapi import APIRouter, Query
from graph.traversal import search_entities
from models.graph import GraphNode

router = APIRouter()

@router.get("", response_model=list[GraphNode])
async def api_search(
    q: str = Query(..., min_length=2),
    domain: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
):
    return await search_entities(q=q, domain=domain, limit=limit)
