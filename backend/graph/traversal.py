from graph.neo4j_client import neo4j_client
from models.graph import GraphNode, GraphEdge, GraphPayload

def _row_to_node(row: dict) -> GraphNode:
    n = row.get("n") or row
    return GraphNode(
        id=n.get("id", ""),
        domain=n.get("domain", ""),
        entity_type=n.get("entity_type", ""),
        label=n.get("label", n.get("id", "")),
        properties={},
        lat=n.get("lat"),
        lon=n.get("lon"),
        valid_from=n.get("valid_from"),
        valid_to=n.get("valid_to"),
        source=n.get("source", ""),
        severity=float(n.get("severity", 5.0)),
    )

def _row_to_edge(row: dict, rel_key: str = "r") -> GraphEdge | None:
    r = row.get(rel_key)
    src = row.get("source_id") or row.get("a", {}).get("id", "")
    tgt = row.get("target_id") or row.get("b", {}).get("id", "")
    if not r or not src or not tgt:
        return None
    rel_type = row.get("rel_type", "RELATES_TO")
    return GraphEdge(
        id=f"{src}_{rel_type}_{tgt}",
        source=src,
        target=tgt,
        relationship=rel_type,
        confidence=float(r.get("confidence", 0.5)),
        lag_weeks=int(r.get("lag_weeks", 0)),
        source_dataset=r.get("source_dataset", ""),
        evidence_type=r.get("evidence_type", "correlational"),
    )

async def get_node(entity_id: str) -> GraphPayload | None:
    query = """
    MATCH (n {id: $entity_id})
    OPTIONAL MATCH (n)-[r]->(b)
    OPTIONAL MATCH (a)-[r2]->(n)
    RETURN n,
           collect(DISTINCT {r: r, rel_type: type(r), source_id: n.id, target_id: b.id, b: b}) AS out_rels,
           collect(DISTINCT {r: r2, rel_type: type(r2), source_id: a.id, target_id: n.id, a: a}) AS in_rels
    """
    rows = await neo4j_client.run(query, entity_id=entity_id)
    if not rows:
        return None
    row = rows[0]
    node = _row_to_node({"n": row["n"]})
    edges: list[GraphEdge] = []
    nodes: list[GraphNode] = [node]
    node_ids = {node.id}
    for rel_row in (row.get("out_rels") or []):
        e = _row_to_edge(rel_row)
        if e:
            edges.append(e)
            b = rel_row.get("b")
            if b and b.get("id") and b["id"] not in node_ids:
                nodes.append(_row_to_node({"n": b}))
                node_ids.add(b["id"])
    for rel_row in (row.get("in_rels") or []):
        e = _row_to_edge(rel_row, rel_key="r")
        if e:
            edges.append(e)
            a = rel_row.get("a")
            if a and a.get("id") and a["id"] not in node_ids:
                nodes.append(_row_to_node({"n": a}))
                node_ids.add(a["id"])
    return GraphPayload(nodes=nodes, edges=edges)

async def expand_node(entity_id: str, hops: int = 1, min_confidence: float = 0.4) -> GraphPayload:
    query = """
    MATCH (start {id: $entity_id})
    CALL apoc.path.subgraphAll(start, {maxLevel: $hops, relationshipFilter: null}) YIELD nodes, relationships
    WITH nodes, relationships
    UNWIND relationships AS r
    WITH nodes, r, startNode(r) AS src, endNode(r) AS tgt
    WHERE r.confidence >= $min_confidence
    RETURN nodes, collect({r: r, rel_type: type(r), source_id: src.id, target_id: tgt.id}) AS rels
    """
    rows = await neo4j_client.run(query, entity_id=entity_id, hops=hops, min_confidence=min_confidence)
    if not rows:
        payload = await get_node(entity_id)
        return payload or GraphPayload(nodes=[], edges=[])
    row = rows[0]
    nodes = [_row_to_node({"n": n}) for n in (row.get("nodes") or [])]
    edges = [e for rel in (row.get("rels") or []) if (e := _row_to_edge(rel)) is not None]
    return GraphPayload(nodes=nodes, edges=edges)

async def find_path(from_id: str, to_id: str) -> GraphPayload:
    query = """
    MATCH (a {id: $from_id}), (b {id: $to_id})
    MATCH p = shortestPath((a)-[*..6]->(b))
    WHERE ALL(r IN relationships(p) WHERE r.confidence >= 0.3)
    RETURN nodes(p) AS path_nodes, relationships(p) AS path_rels,
           [r IN relationships(p) | type(r)] AS rel_types
    """
    rows = await neo4j_client.run(query, from_id=from_id, to_id=to_id)
    if not rows:
        return GraphPayload(nodes=[], edges=[])
    row = rows[0]
    path_nodes = [_row_to_node({"n": n}) for n in (row.get("path_nodes") or [])]
    rel_types = row.get("rel_types") or []
    rels = row.get("path_rels") or []
    path_ids = [n.id for n in path_nodes]
    edges = []
    for i, r in enumerate(rels):
        if i + 1 < len(path_ids):
            rt = rel_types[i] if i < len(rel_types) else "RELATES_TO"
            sid, tid = path_ids[i], path_ids[i + 1]
            edges.append(GraphEdge(
                id=f"{sid}_{rt}_{tid}",
                source=sid,
                target=tid,
                relationship=rt,
                confidence=float(r.get("confidence", 0.5)),
                lag_weeks=int(r.get("lag_weeks", 0)),
                source_dataset=r.get("source_dataset", ""),
                evidence_type=r.get("evidence_type", "correlational"),
            ))
    return GraphPayload(nodes=path_nodes, edges=edges)

async def get_cascade(entity_type: str, min_confidence: float = 0.4) -> GraphPayload:
    query = """
    MATCH p = (start)-[*2..5]->(end)
    WHERE start.entity_type = $entity_type
    AND ALL(r IN relationships(p) WHERE r.confidence >= $min_confidence)
    WITH p,
         REDUCE(conf = 1.0, r IN relationships(p) | conf * r.confidence) AS path_conf
    WHERE path_conf > 0.1
    WITH nodes(p) AS ns, relationships(p) AS rs,
         [r IN relationships(p) | type(r)] AS rts
    ORDER BY path_conf DESC LIMIT 20
    RETURN COLLECT(DISTINCT ns) AS all_nodes, COLLECT({rels: rs, types: rts}) AS all_paths
    """
    rows = await neo4j_client.run(query, entity_type=entity_type, min_confidence=min_confidence)
    if not rows:
        return GraphPayload(nodes=[], edges=[])
    row = rows[0]
    node_map: dict[str, GraphNode] = {}
    for node_list in (row.get("all_nodes") or []):
        for n in node_list:
            nd = _row_to_node({"n": n})
            node_map[nd.id] = nd
    edges: list[GraphEdge] = []
    for path in (row.get("all_paths") or []):
        rels = path.get("rels") or []
        rts = path.get("types") or []
        for i, r in enumerate(rels):
            rt = rts[i] if i < len(rts) else "RELATES_TO"
            src_id = r.get("start", {}).get("id") if isinstance(r, dict) else None
            tgt_id = r.get("end", {}).get("id") if isinstance(r, dict) else None
            if src_id and tgt_id:
                edges.append(GraphEdge(
                    id=f"{src_id}_{rt}_{tgt_id}",
                    source=src_id,
                    target=tgt_id,
                    relationship=rt,
                    confidence=float(r.get("confidence", 0.5)) if isinstance(r, dict) else 0.5,
                    lag_weeks=0,
                    source_dataset="",
                    evidence_type="correlational",
                ))
    return GraphPayload(nodes=list(node_map.values()), edges=edges)

async def search_entities(q: str, domain: str | None = None, limit: int = 20) -> list[GraphNode]:
    if domain:
        query = """
        MATCH (n)
        WHERE n.domain = $domain AND toLower(n.label) CONTAINS toLower($q)
        RETURN n LIMIT $limit
        """
        rows = await neo4j_client.run(query, domain=domain, q=q, limit=limit)
    else:
        query = """
        MATCH (n)
        WHERE toLower(n.label) CONTAINS toLower($q)
           OR toLower(n.entity_type) CONTAINS toLower($q)
        RETURN n LIMIT $limit
        """
        rows = await neo4j_client.run(query, q=q, limit=limit)
    return [_row_to_node(r) for r in rows]
