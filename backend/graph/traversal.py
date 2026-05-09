import json
from db.supabase_client import get_supabase
from etl.ingesters.geography.global_backbone import load_world_bank_countries
from graph.neo4j_client import neo4j_client
from models.graph import GraphNode, GraphEdge, GraphPayload

NODE_FIELDS = ".id, .domain, .entity_type, .label, .properties_json, .lat, .lon, .valid_from, .valid_to, .source, .severity"
REL_FIELDS = ".confidence, .lag_weeks, .source_dataset, .evidence_type"

def _decode_properties(value: object) -> dict:
    if isinstance(value, dict):
        return value
    if isinstance(value, str) and value:
        try:
            decoded = json.loads(value)
            if isinstance(decoded, dict):
                return decoded
        except json.JSONDecodeError:
            return {}
    return {}

def _active_expr(alias: str) -> str:
    return f"($as_of IS NULL OR (({alias}.valid_from IS NULL OR {alias}.valid_from <= $as_of) AND ({alias}.valid_to IS NULL OR {alias}.valid_to >= $as_of)))"

def _node_projection(alias: str) -> str:
    return f"{alias} {{ {NODE_FIELDS} }}"

def _rel_projection(alias: str) -> str:
    return f"{alias} {{ {REL_FIELDS} }}"

def _row_to_node(row: dict) -> GraphNode:
    n = row.get("n") or row
    severity = n.get("severity")
    return GraphNode(
        id=n.get("id", ""),
        domain=n.get("domain", ""),
        entity_type=n.get("entity_type", ""),
        label=n.get("label", n.get("id", "")),
        properties=_decode_properties(n.get("properties_json") or n.get("properties")),
        lat=n.get("lat"),
        lon=n.get("lon"),
        valid_from=n.get("valid_from"),
        valid_to=n.get("valid_to"),
        source=n.get("source", ""),
        severity=float(severity) if isinstance(severity, (int, float)) else 0.0,
    )

def _row_to_edge(row: dict, rel_key: str = "r") -> GraphEdge | None:
    r = row.get(rel_key) or row
    src = row.get("source_id") or r.get("source_id") or (row.get("a") or {}).get("id", "")
    tgt = row.get("target_id") or r.get("target_id") or (row.get("b") or {}).get("id", "")
    if not src or not tgt:
        return None
    rel_type = row.get("rel_type") or r.get("rel_type") or "RELATES_TO"
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

def _supabase_row_to_node(row: dict) -> GraphNode | None:
    entity_id = row.get("entity_id")
    entity_type = row.get("entity_type")
    if not isinstance(entity_id, str) or not isinstance(entity_type, str):
        return None
    properties = row.get("properties") if isinstance(row.get("properties"), dict) else {}
    label = properties.get("label") if isinstance(properties.get("label"), str) else entity_type
    return GraphNode(
        id=entity_id,
        domain=row.get("domain", ""),
        entity_type=entity_type,
        label=label,
        properties=properties,
        lat=row.get("lat"),
        lon=row.get("lon"),
        valid_from=row.get("valid_from"),
        valid_to=row.get("valid_to"),
        source=row.get("source_dataset", ""),
        severity=float(row.get("metric_value") or 5.0),
    )

def _load_metrics_rows(limit: int = 5000) -> list[dict]:
    client = get_supabase()
    result = (
        client.table("metrics")
        .select("domain,entity_type,entity_id,lat,lon,valid_from,valid_to,source_dataset,metric_value,properties")
        .limit(limit)
        .execute()
    )
    return result.data or []

async def _search_country_nodes(q: str, limit: int) -> list[GraphNode]:
    query = q.strip().lower()
    if not query:
        return []

    countries = await load_world_bank_countries()
    matches: list[GraphNode] = []
    for country in countries:
        code = str(country.get("code") or "").upper()
        name = str(country.get("name") or code)
        region = str(country.get("region") or "")
        income_level = str(country.get("income_level") or "")
        capital_city = str(country.get("capital_city") or "")
        haystack = f"{code} {name} {region} {income_level} {capital_city}".lower()
        if query not in haystack and query not in code.lower():
            continue
        matches.append(
            GraphNode(
                id=f"country:{code}",
                domain="meta",
                entity_type="CountryProfile",
                label=name,
                properties={
                    "country_code": code,
                    "country_name": name,
                    "region": region,
                    "income_level": income_level,
                    "capital_city": capital_city,
                },
                lat=country.get("latitude"),
                lon=country.get("longitude"),
                source="derived_context",
                severity=0.0,
            )
        )

    def score(node: GraphNode) -> tuple[int, int, str]:
        label = node.label.lower()
        code = str(node.properties.get("country_code") or "").lower()
        exact = 2 if query == code or query == label else 0
        prefix = 1 if label.startswith(query) or code.startswith(query) else 0
        return (exact, prefix, label)

    matches.sort(key=score, reverse=True)
    return matches[:limit]

def _search_metrics_rows(q: str, domain: str | None, limit: int) -> list[GraphNode]:
    q_lower = q.lower()
    seen: set[str] = set()
    matches: list[GraphNode] = []
    for row in _load_metrics_rows():
        if domain and row.get("domain") != domain:
            continue
        node = _supabase_row_to_node(row)
        if not node or node.id in seen:
            continue
        haystack = f"{node.label} {node.entity_type} {node.domain}".lower()
        if q_lower not in haystack:
            continue
        seen.add(node.id)
        matches.append(node)
        if len(matches) >= limit:
            break
    return matches

def _load_country_nodes(country_code: str, as_of: str | None, limit: int) -> list[GraphNode]:
    client = get_supabase()
    query = (
        client.table("metrics")
        .select("domain,entity_type,entity_id,lat,lon,valid_from,valid_to,source_dataset,metric_value,properties,country_code")
        .eq("country_code", country_code)
        .order("valid_from", desc=False)
        .limit(limit)
    )
    if as_of:
        query = query.lte("valid_from", as_of)
    rows = query.execute().data or []
    nodes = [_supabase_row_to_node(row) for row in rows]
    return [node for node in nodes if node is not None]

def _get_metric_node(entity_id: str) -> GraphNode | None:
    client = get_supabase()
    result = (
        client.table("metrics")
        .select("domain,entity_type,entity_id,lat,lon,valid_from,valid_to,source_dataset,metric_value,properties")
        .eq("entity_id", entity_id)
        .limit(1)
        .execute()
    )
    rows = result.data or []
    return _supabase_row_to_node(rows[0]) if rows else None

def _node_country_code(node: GraphNode) -> str | None:
    value = node.properties.get("country_code") if isinstance(node.properties, dict) else None
    if isinstance(value, str) and value.strip():
        return value.strip().upper()
    return None

def _node_year(node: GraphNode) -> str | None:
    if isinstance(node.valid_from, str) and len(node.valid_from) >= 4:
        return node.valid_from[:4]
    return None

def _dataset_node_id(source: str) -> str:
    slug = "".join(ch.lower() if ch.isalnum() else "_" for ch in source).strip("_")
    while "__" in slug:
        slug = slug.replace("__", "_")
    return f"dataset:{slug or 'unknown_dataset'}"

def _load_series_nodes(entity_type: str, country_code: str, as_of: str | None, limit: int) -> list[GraphNode]:
    client = get_supabase()
    query = (
        client.table("metrics")
        .select("domain,entity_type,entity_id,lat,lon,valid_from,valid_to,source_dataset,metric_value,properties,country_code")
        .eq("entity_type", entity_type)
        .eq("country_code", country_code)
        .order("valid_from", desc=False)
        .limit(limit)
    )
    if as_of:
        query = query.lte("valid_from", as_of)
    rows = query.execute().data or []
    nodes = [_supabase_row_to_node(row) for row in rows]
    return [node for node in nodes if node is not None]

def _derive_structural_graph(nodes: list[GraphNode]) -> GraphPayload:
    node_map: dict[str, GraphNode] = {}
    edge_map: dict[str, GraphEdge] = {}

    for node in nodes:
        node_map[node.id] = node
        country_code = _node_country_code(node)
        year = _node_year(node)
        if country_code:
            country_id = f"country:{country_code}"
            if country_id not in node_map:
                node_map[country_id] = GraphNode(
                    id=country_id,
                    domain="meta",
                    entity_type="Country",
                    label=country_code,
                    properties={},
                    source="derived_context",
                    severity=0.0,
                )
            edge_id = f"{node.id}_OBSERVED_IN_{country_id}"
            edge_map[edge_id] = GraphEdge(
                id=edge_id,
                source=node.id,
                target=country_id,
                relationship="OBSERVED_IN",
                confidence=1.0,
                lag_weeks=0,
                source_dataset="derived_context",
                evidence_type="structural",
            )
        if year:
            year_id = f"year:{year}"
            if year_id not in node_map:
                node_map[year_id] = GraphNode(
                    id=year_id,
                    domain="meta",
                    entity_type="Year",
                    label=year,
                    properties={},
                    source="derived_context",
                    severity=0.0,
                )
            edge_id = f"{node.id}_RECORDED_IN_{year_id}"
            edge_map[edge_id] = GraphEdge(
                id=edge_id,
                source=node.id,
                target=year_id,
                relationship="RECORDED_IN",
                confidence=1.0,
                lag_weeks=0,
                source_dataset="derived_context",
                evidence_type="structural",
            )
        if node.source:
            dataset_id = _dataset_node_id(node.source)
            if dataset_id not in node_map:
                node_map[dataset_id] = GraphNode(
                    id=dataset_id,
                    domain="meta",
                    entity_type="Dataset",
                    label=node.source,
                    properties={},
                    source="derived_context",
                    severity=0.0,
                )
            edge_id = f"{node.id}_SOURCED_FROM_{dataset_id}"
            edge_map[edge_id] = GraphEdge(
                id=edge_id,
                source=node.id,
                target=dataset_id,
                relationship="SOURCED_FROM",
                confidence=1.0,
                lag_weeks=0,
                source_dataset="derived_context",
                evidence_type="structural",
            )

    ordered_real_nodes = sorted(
        [node for node in node_map.values() if node.domain != "meta"],
        key=lambda item: (item.valid_from or "", item.id),
    )
    for current, nxt in zip(ordered_real_nodes, ordered_real_nodes[1:]):
        current_year = _node_year(current)
        next_year = _node_year(nxt)
        lag_weeks = 0
        if current_year and next_year and current_year.isdigit() and next_year.isdigit():
            lag_weeks = max((int(next_year) - int(current_year)) * 52, 0)
        edge_id = f"{current.id}_PRECEDES_{nxt.id}"
        edge_map[edge_id] = GraphEdge(
            id=edge_id,
            source=current.id,
            target=nxt.id,
            relationship="PRECEDES",
            confidence=0.95,
            lag_weeks=lag_weeks,
            source_dataset="derived_context",
            evidence_type="temporal",
        )

    return GraphPayload(nodes=list(node_map.values()), edges=list(edge_map.values()))

async def get_node(entity_id: str, as_of: str | None = None) -> GraphPayload | None:
    query = f"""
    MATCH (n {{id: $entity_id}})
    WHERE {_active_expr("n")}
    OPTIONAL MATCH (n)-[r]->(b)
    WHERE b IS NULL OR {_active_expr("b")}
    OPTIONAL MATCH (a)-[r2]->(n)
    WHERE a IS NULL OR {_active_expr("a")}
    RETURN {_node_projection("n")} AS n,
           collect(DISTINCT CASE WHEN b IS NULL THEN NULL ELSE {{r: {_rel_projection("r")}, rel_type: type(r), source_id: n.id, target_id: b.id, b: {_node_projection("b")}}} END) AS out_rels,
           collect(DISTINCT CASE WHEN a IS NULL THEN NULL ELSE {{r: {_rel_projection("r2")}, rel_type: type(r2), source_id: a.id, target_id: n.id, a: {_node_projection("a")}}} END) AS in_rels
    """
    rows = await neo4j_client.run(query, entity_id=entity_id, as_of=as_of)
    if not rows:
        node = _get_metric_node(entity_id)
        return GraphPayload(nodes=[node], edges=[]) if node else None
    row = rows[0]
    if not row.get("n"):
        return None
    node = _row_to_node({"n": row["n"]})
    edges: list[GraphEdge] = []
    nodes: list[GraphNode] = [node]
    node_ids = {node.id}
    for rel_row in row.get("out_rels") or []:
        if not rel_row:
            continue
        edge = _row_to_edge(rel_row)
        if edge:
            edges.append(edge)
            peer = rel_row.get("b")
            if peer and peer.get("id") not in node_ids:
                nodes.append(_row_to_node({"n": peer}))
                node_ids.add(peer["id"])
    for rel_row in row.get("in_rels") or []:
        if not rel_row:
            continue
        edge = _row_to_edge(rel_row)
        if edge:
            edges.append(edge)
            peer = rel_row.get("a")
            if peer and peer.get("id") not in node_ids:
                nodes.append(_row_to_node({"n": peer}))
                node_ids.add(peer["id"])
    return GraphPayload(nodes=nodes, edges=edges)

async def expand_node(entity_id: str, hops: int = 1, min_confidence: float = 0.4, as_of: str | None = None) -> GraphPayload:
    query = f"""
    MATCH (start {{id: $entity_id}})
    WHERE {_active_expr("start")}
    CALL apoc.path.subgraphAll(start, {{maxLevel: $hops}}) YIELD nodes, relationships
    WITH nodes, relationships
    WHERE ALL(n IN nodes WHERE {_active_expr("n")})
    RETURN [n IN nodes | {_node_projection("n")}] AS nodes,
           [rel IN relationships
            WHERE coalesce(rel.confidence, 0.0) >= $min_confidence |
            {{
                rel_type: type(rel),
                source_id: startNode(rel).id,
                target_id: endNode(rel).id,
                confidence: coalesce(rel.confidence, 0.5),
                lag_weeks: coalesce(rel.lag_weeks, 0),
                source_dataset: coalesce(rel.source_dataset, ''),
                evidence_type: coalesce(rel.evidence_type, 'correlational')
            }}] AS rels
    """
    try:
        rows = await neo4j_client.run(query, entity_id=entity_id, hops=hops, min_confidence=min_confidence, as_of=as_of)
    except Exception:
        rows = []
    if not rows:
        payload = await get_node(entity_id, as_of=as_of)
        return payload or GraphPayload(nodes=[], edges=[])
    row = rows[0]
    nodes = [_row_to_node({"n": n}) for n in row.get("nodes") or []]
    edges = [edge for rel in row.get("rels") or [] if (edge := _row_to_edge(rel, rel_key="")) is not None]
    return GraphPayload(nodes=nodes, edges=edges)

async def find_path(from_id: str, to_id: str, as_of: str | None = None) -> GraphPayload:
    query = f"""
    MATCH (a {{id: $from_id}}), (b {{id: $to_id}})
    WHERE {_active_expr("a")} AND {_active_expr("b")}
    MATCH p = shortestPath((a)-[*..6]->(b))
    WHERE ALL(n IN nodes(p) WHERE {_active_expr("n")})
      AND ALL(r IN relationships(p) WHERE coalesce(r.confidence, 0.0) >= 0.3)
    RETURN [n IN nodes(p) | {_node_projection("n")}] AS path_nodes,
           [rel IN relationships(p) | {{
               rel_type: type(rel),
               source_id: startNode(rel).id,
               target_id: endNode(rel).id,
               confidence: coalesce(rel.confidence, 0.5),
               lag_weeks: coalesce(rel.lag_weeks, 0),
               source_dataset: coalesce(rel.source_dataset, ''),
               evidence_type: coalesce(rel.evidence_type, 'correlational')
           }}] AS path_rels
    """
    rows = await neo4j_client.run(query, from_id=from_id, to_id=to_id, as_of=as_of)
    if not rows:
        return GraphPayload(nodes=[], edges=[])
    row = rows[0]
    nodes = [_row_to_node({"n": n}) for n in row.get("path_nodes") or []]
    edges = [edge for rel in row.get("path_rels") or [] if (edge := _row_to_edge(rel, rel_key="")) is not None]
    return GraphPayload(nodes=nodes, edges=edges)

async def get_cascade(entity_type: str, min_confidence: float = 0.4, as_of: str | None = None) -> GraphPayload:
    query = f"""
    MATCH p = (start)-[*2..5]->(end)
    WHERE start.entity_type = $entity_type
      AND ALL(n IN nodes(p) WHERE {_active_expr("n")})
      AND ALL(r IN relationships(p) WHERE coalesce(r.confidence, 0.0) >= $min_confidence)
    WITH nodes(p) AS ns,
         [rel IN relationships(p) | {{
             rel_type: type(rel),
             source_id: startNode(rel).id,
             target_id: endNode(rel).id,
             confidence: coalesce(rel.confidence, 0.5),
             lag_weeks: coalesce(rel.lag_weeks, 0),
             source_dataset: coalesce(rel.source_dataset, ''),
             evidence_type: coalesce(rel.evidence_type, 'correlational')
         }}] AS rels,
         REDUCE(conf = 1.0, rel IN relationships(p) | conf * coalesce(rel.confidence, 0.5)) AS path_conf
    WHERE path_conf > 0.1
    ORDER BY path_conf DESC
    LIMIT 20
    RETURN collect([n IN ns | {_node_projection("n")}]) AS all_nodes, collect(rels) AS all_rels
    """
    rows = await neo4j_client.run(query, entity_type=entity_type, min_confidence=min_confidence, as_of=as_of)
    if not rows:
        return GraphPayload(nodes=[], edges=[])
    row = rows[0]
    node_map: dict[str, GraphNode] = {}
    for node_list in row.get("all_nodes") or []:
        for item in node_list:
            node = _row_to_node({"n": item})
            node_map[node.id] = node
    edge_map: dict[str, GraphEdge] = {}
    for rel_list in row.get("all_rels") or []:
        for rel in rel_list:
            edge = _row_to_edge(rel, rel_key="")
            if edge:
                edge_map[edge.id] = edge
    return GraphPayload(nodes=list(node_map.values()), edges=list(edge_map.values()))

async def search_entities(q: str, domain: str | None = None, limit: int = 20) -> list[GraphNode]:
    if neo4j_client.is_connected:
        if domain:
            query = f"""
            MATCH (n)
            WHERE n.domain = $domain
              AND (toLower(n.label) CONTAINS toLower($q) OR toLower(n.entity_type) CONTAINS toLower($q))
            OPTIONAL MATCH (n)-[r]-()
            WITH n, count(r) AS degree,
                 CASE
                   WHEN toLower(n.entity_type) = toLower($q) THEN 3
                   WHEN toLower(n.label) = toLower($q) THEN 3
                   WHEN toLower(n.label) CONTAINS toLower($q) THEN 2
                   ELSE 1
                 END AS score
            RETURN {_node_projection('n')} AS n
            ORDER BY score DESC, degree DESC, coalesce(n.severity, 0.0) DESC, coalesce(n.valid_from, '') DESC
            LIMIT $limit
            """
            rows = await neo4j_client.run(query, domain=domain, q=q, limit=limit)
        else:
            query = f"""
            MATCH (n)
            WHERE toLower(n.label) CONTAINS toLower($q) OR toLower(n.entity_type) CONTAINS toLower($q)
            OPTIONAL MATCH (n)-[r]-()
            WITH n, count(r) AS degree,
                 CASE
                   WHEN toLower(n.entity_type) = toLower($q) THEN 3
                   WHEN toLower(n.label) = toLower($q) THEN 3
                   WHEN toLower(n.label) CONTAINS toLower($q) THEN 2
                   ELSE 1
                 END AS score
            RETURN {_node_projection('n')} AS n
            ORDER BY score DESC, degree DESC, coalesce(n.severity, 0.0) DESC, coalesce(n.valid_from, '') DESC
            LIMIT $limit
            """
            rows = await neo4j_client.run(query, q=q, limit=limit)
        if rows:
            return [_row_to_node(row) for row in rows]
    matches = _search_metrics_rows(q=q, domain=domain, limit=limit)
    if matches:
        return matches
    if domain and domain not in {"meta", "all"}:
        return []
    return await _search_country_nodes(q=q, limit=limit)

async def search_graph(q: str, domain: str | None = None, limit: int = 12, min_confidence: float = 0.4, as_of: str | None = None) -> GraphPayload:
    matches = await search_entities(q=q, domain=domain, limit=limit)
    if not matches:
        return GraphPayload(nodes=[], edges=[])

    primary = next((node for node in matches if node.domain != "meta"), matches[0])
    primary_country = _node_country_code(primary)
    if primary_country:
        country_nodes = _load_country_nodes(primary_country, as_of=as_of, limit=max(400, limit * 20))
        if country_nodes:
            if primary.domain == "meta" or primary.entity_type in {"Country", "CountryProfile", "AdminArea", "AdminSubdivision"}:
                return _derive_structural_graph(country_nodes)

            series_nodes = (
                _load_series_nodes(primary.entity_type, primary_country, as_of=as_of, limit=20)
                if primary.entity_type
                else []
            )
            return _derive_structural_graph(country_nodes + series_nodes)

    series_nodes = (
        _load_series_nodes(primary.entity_type, primary_country, as_of=as_of, limit=8)
        if primary_country and primary.entity_type
        else []
    )
    if series_nodes:
        return _derive_structural_graph(series_nodes)

    if not neo4j_client.is_connected:
        return _derive_structural_graph(matches)

    node_map: dict[str, GraphNode] = {}
    edge_map: dict[str, GraphEdge] = {}
    for match in matches[:3]:
        payload = await expand_node(match.id, hops=1, min_confidence=min_confidence, as_of=as_of)
        for node in payload.nodes:
            node_map[node.id] = node
        for edge in payload.edges:
            edge_map[edge.id] = edge
    if edge_map:
        return GraphPayload(nodes=list(node_map.values()), edges=list(edge_map.values()))
    return _derive_structural_graph(matches)
