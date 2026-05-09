from fastapi import APIRouter, HTTPException, Query
from graph.traversal import get_node, expand_node, find_path, get_cascade
from models.graph import GraphPayload
from db.cache import cached

router = APIRouter()

@router.get("/node/{entity_id}", response_model=GraphPayload)
async def api_get_node(
    entity_id: str,
    as_of: str | None = Query(default=None),
):
    payload = await _cached_get_node(entity_id, as_of)
    if not payload:
        raise HTTPException(status_code=404, detail=f"Node '{entity_id}' not found")
    return payload

@cached(ttl=600, key_prefix="node")
async def _cached_get_node(entity_id: str, as_of: str | None):
    payload = await get_node(entity_id, as_of=as_of)
    return payload.model_dump() if payload else None

@router.get("/expand/{entity_id}", response_model=GraphPayload)
async def api_expand_node(
    entity_id: str,
    hops: int = Query(default=1, ge=1, le=3),
    min_confidence: float = Query(default=0.4, ge=0.0, le=1.0),
    as_of: str | None = Query(default=None),
):
    result = await _cached_expand(entity_id, hops, min_confidence, as_of)
    return result

@cached(ttl=300, key_prefix="expand")
async def _cached_expand(entity_id: str, hops: int, min_confidence: float, as_of: str | None):
    payload = await expand_node(entity_id, hops=hops, min_confidence=min_confidence, as_of=as_of)
    return payload.model_dump()

@router.get("/path", response_model=GraphPayload)
async def api_find_path(
    from_id: str = Query(...),
    to_id: str = Query(...),
    as_of: str | None = Query(default=None),
):
    payload = await find_path(from_id, to_id, as_of=as_of)
    if not payload.nodes:
        raise HTTPException(status_code=404, detail="No path found between nodes")
    return payload

@router.get("/cascade/{entity_type}", response_model=GraphPayload)
async def api_cascade(
    entity_type: str,
    min_confidence: float = Query(default=0.4, ge=0.0, le=1.0),
    as_of: str | None = Query(default=None),
):
    result = await _cached_cascade(entity_type, min_confidence, as_of)
    return result

@cached(ttl=600, key_prefix="cascade")
async def _cached_cascade(entity_type: str, min_confidence: float, as_of: str | None):
    payload = await get_cascade(entity_type, min_confidence=min_confidence, as_of=as_of)
    return payload.model_dump()

@router.get("/concepts")
async def api_concepts():
    from graph.neo4j_client import neo4j_client
    rows = await neo4j_client.run("""
        MATCH (n)
        RETURN n.entity_type AS type, n.domain AS domain, count(*) AS count
        ORDER BY count DESC LIMIT 50
    """)
    return {"concepts": rows}
