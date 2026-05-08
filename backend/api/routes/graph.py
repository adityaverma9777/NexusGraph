from fastapi import APIRouter, HTTPException, Query
from graph.traversal import get_node, expand_node, find_path, get_cascade
from models.graph import GraphPayload

router = APIRouter()

@router.get("/node/{entity_id}", response_model=GraphPayload)
async def api_get_node(entity_id: str):
    payload = await get_node(entity_id)
    if not payload:
        raise HTTPException(status_code=404, detail=f"Node '{entity_id}' not found")
    return payload

@router.get("/expand/{entity_id}", response_model=GraphPayload)
async def api_expand_node(
    entity_id: str,
    hops: int = Query(default=1, ge=1, le=3),
    min_confidence: float = Query(default=0.4, ge=0.0, le=1.0),
):
    return await expand_node(entity_id, hops=hops, min_confidence=min_confidence)

@router.get("/path", response_model=GraphPayload)
async def api_find_path(
    from_id: str = Query(...),
    to_id: str = Query(...),
):
    payload = await find_path(from_id, to_id)
    if not payload.nodes:
        raise HTTPException(status_code=404, detail="No path found between nodes")
    return payload

@router.get("/cascade/{entity_type}", response_model=GraphPayload)
async def api_cascade(
    entity_type: str,
    min_confidence: float = Query(default=0.4, ge=0.0, le=1.0),
):
    return await get_cascade(entity_type, min_confidence=min_confidence)

@router.get("/concepts")
async def api_concepts():
    from graph.neo4j_client import neo4j_client
    rows = await neo4j_client.run("""
        MATCH (n)
        RETURN n.entity_type AS type, n.domain AS domain, count(*) AS count
        ORDER BY count DESC LIMIT 50
    """)
    return {"concepts": rows}
