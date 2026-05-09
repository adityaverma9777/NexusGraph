import json
import re
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from collections import defaultdict
from loguru import logger
from models.graph import ETLNode, ETLEdge
from db.supabase_client import get_supabase
from graph.neo4j_client import neo4j_client
from config import get_settings

class BaseIngester(ABC):
    domain: str = ""
    source_name: str = ""

    @abstractmethod
    async def fetch(self) -> list[dict]:
        ...

    @abstractmethod
    def transform(self, raw: list[dict]) -> list[ETLNode]:
        ...

    @abstractmethod
    def infer_edges(self, nodes: list[ETLNode]) -> list[ETLEdge]:
        ...

    async def run(self) -> dict:
        steps = [
            "fetch source data",
            "transform records",
            "infer relationships",
            "write metrics to Supabase",
            "write nodes and context to Neo4j Aura",
            "write relationships to Supabase",
            "write relationships to Neo4j Aura",
            "update dataset registry",
        ]
        total_steps = len(steps)
        logger.info(f"[{self.source_name}] Starting ingestion")
        try:
            logger.info(f"[{self.source_name}] Step 1/{total_steps}: {steps[0]}")
            raw = await self.fetch()
            logger.info(f"[{self.source_name}] Fetched {len(raw)} raw records")
            logger.info(f"[{self.source_name}] Step 2/{total_steps}: {steps[1]}")
            nodes = self.transform(raw)
            nodes = _select_nodes_for_budget(nodes, get_settings().free_tier_node_budget)
            logger.info(f"[{self.source_name}] Transformed to {len(nodes)} budgeted nodes")
            logger.info(f"[{self.source_name}] Step 3/{total_steps}: {steps[2]}")
            edges = self.infer_edges(nodes)
            edges = _select_edges_for_budget(edges, get_settings().free_tier_edge_budget)
            logger.info(f"[{self.source_name}] Inferred {len(edges)} budgeted edges")
            logger.info(f"[{self.source_name}] Step 4/{total_steps}: {steps[3]}")
            await self._write_nodes_to_supabase(nodes)
            logger.info(f"[{self.source_name}] Step 5/{total_steps}: {steps[4]}")
            await self._write_nodes_to_neo4j(nodes)
            logger.info(f"[{self.source_name}] Step 6/{total_steps}: {steps[5]}")
            await self._write_edges_to_supabase(edges)
            logger.info(f"[{self.source_name}] Step 7/{total_steps}: {steps[6]}")
            await self._write_edges_to_neo4j(edges)
            logger.info(f"[{self.source_name}] Step 8/{total_steps}: {steps[7]}")
            await self._update_registry(len(nodes))
            return {"source": self.source_name, "nodes": len(nodes), "edges": len(edges)}
        except Exception as exc:
            logger.error(f"[{self.source_name}] Ingestion failed: {exc}")
            raise

    async def _write_nodes_to_supabase(self, nodes: list[ETLNode]) -> None:
        if not nodes:
            return
        client = get_supabase()
        rows = [
            {
                "domain": n.domain,
                "entity_type": n.entity_type,
                "entity_id": n.id,
                "lat": n.lat,
                "lon": n.lon,
                "country_code": _resolve_country_code(n),
                "admin1_code": _resolve_admin1_code(n),
                "metric_name": "severity",
                "metric_value": n.severity,
                "unit": "score",
                "valid_from": n.valid_from or "1970-01-01",
                "valid_to": n.valid_to,
                "source_dataset": n.source,
                "properties": _build_properties_payload(n),
            }
            for n in nodes
        ]
        client.table("metrics").upsert(rows, on_conflict="entity_id,metric_name").execute()

    async def _write_nodes_to_neo4j(self, nodes: list[ETLNode]) -> None:
        if not nodes or not neo4j_client.is_connected:
            return
        query = """
        UNWIND $nodes AS n
        MERGE (node {id: n.id})
        SET node += {
            domain: n.domain,
            entity_type: n.entity_type,
            label: n.label,
            lat: n.lat,
            lon: n.lon,
            country_code: n.country_code,
            admin1_code: n.admin1_code,
            severity: n.severity,
            valid_from: n.valid_from,
            valid_to: n.valid_to,
            source: n.source
        }
        SET node.properties_json = n.properties_json
        """
        node_dicts = [
            {
                "id": n.id,
                "domain": n.domain,
                "entity_type": n.entity_type,
                "label": n.label,
                "lat": n.lat,
                "lon": n.lon,
                "country_code": _resolve_country_code(n),
                "admin1_code": _resolve_admin1_code(n),
                "severity": n.severity,
                "valid_from": n.valid_from,
                "valid_to": n.valid_to,
                "source": n.source,
                "properties_json": json.dumps(_build_properties_payload(n), default=str),
            }
            for n in nodes
        ]
        await neo4j_client.run(query, nodes=node_dicts)
        await neo4j_client.run(
            """
            UNWIND $nodes AS n
            MATCH (node {id: n.id})
            FOREACH (_ IN CASE WHEN n.country_code IS NULL OR n.country_code = '' THEN [] ELSE [1] END |
                MERGE (country:Country {id: 'country:' + n.country_code})
                SET country.label = n.country_code,
                    country.domain = 'meta',
                    country.entity_type = 'Country',
                    country.source = 'derived_context'
                MERGE (node)-[r:OBSERVED_IN]->(country)
                SET r.confidence = 1.0,
                    r.lag_weeks = 0,
                    r.source_dataset = 'derived_context',
                    r.evidence_type = 'structural'
            )
            FOREACH (_ IN CASE WHEN n.admin1_code IS NULL OR n.admin1_code = '' THEN [] ELSE [1] END |
                MERGE (admin:AdminArea {id: 'admin1:' + coalesce(n.country_code, 'UNK') + ':' + n.admin1_code})
                SET admin.label = coalesce(n.country_code, 'UNK') + ' ' + n.admin1_code,
                    admin.domain = 'meta',
                    admin.entity_type = 'AdminArea',
                    admin.source = 'derived_context'
                MERGE (node)-[r:LOCATED_IN]->(admin)
                SET r.confidence = 1.0,
                    r.lag_weeks = 0,
                    r.source_dataset = 'derived_context',
                    r.evidence_type = 'structural'
            )
            FOREACH (_ IN CASE WHEN n.valid_from IS NULL OR size(n.valid_from) < 4 THEN [] ELSE [1] END |
                MERGE (year:Year {id: 'year:' + substring(n.valid_from, 0, 4)})
                SET year.label = substring(n.valid_from, 0, 4),
                    year.domain = 'meta',
                    year.entity_type = 'Year',
                    year.source = 'derived_context'
                MERGE (node)-[r:RECORDED_IN]->(year)
                SET r.confidence = 1.0,
                    r.lag_weeks = 0,
                    r.source_dataset = 'derived_context',
                    r.evidence_type = 'structural'
            )
            FOREACH (_ IN CASE WHEN n.dataset_key IS NULL OR n.dataset_key = '' THEN [] ELSE [1] END |
                MERGE (dataset:Dataset {id: 'dataset:' + n.dataset_key})
                SET dataset.label = n.source,
                    dataset.domain = 'meta',
                    dataset.entity_type = 'Dataset',
                    dataset.source = 'derived_context'
                MERGE (node)-[r:SOURCED_FROM]->(dataset)
                SET r.confidence = 1.0,
                    r.lag_weeks = 0,
                    r.source_dataset = 'derived_context',
                    r.evidence_type = 'structural'
            )
            """,
            nodes=[
                {
                    "id": item["id"],
                    "country_code": item["country_code"],
                    "admin1_code": item["admin1_code"],
                    "valid_from": item["valid_from"],
                    "source": item["source"],
                    "dataset_key": _dataset_key(item["source"]),
                }
                for item in node_dicts
            ],
        )

    async def _write_edges_to_neo4j(self, edges: list[ETLEdge]) -> None:
        await write_edges_to_neo4j(edges)

    async def _write_edges_to_supabase(self, edges: list[ETLEdge]) -> None:
        await write_edges_to_supabase(edges)

    async def _update_registry(self, record_count: int) -> None:
        try:
            client = get_supabase()
            client.table("dataset_registry").upsert(
                {
                    "name": self.source_name,
                    "domain": self.domain,
                    "record_count": record_count,
                    "last_ingested_at": datetime.now(timezone.utc).isoformat(),
                    "is_active": True,
                },
                on_conflict="name",
            ).execute()
        except Exception as exc:
            logger.warning(f"Registry update failed: {exc}")

def _as_string(value: object | None) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        text = value.strip()
    else:
        text = str(value).strip()
    return text or None

def _resolve_country_code(node: ETLNode) -> str | None:
    candidates = (
        node.country_code,
        node.properties.get("country_code"),
        node.properties.get("origin_country"),
        node.properties.get("country"),
    )
    for candidate in candidates:
        value = _as_string(candidate)
        if not value:
            continue
        value = value.upper()
        if len(value) == 3 and value.isalpha():
            return value
    return None

def _resolve_admin1_code(node: ETLNode) -> str | None:
    candidates = (
        node.admin1_code,
        node.properties.get("admin1_code"),
        node.properties.get("admin1"),
    )
    for candidate in candidates:
        value = _as_string(candidate)
        if value:
            return value.upper()
    return None

def _build_properties_payload(node: ETLNode) -> dict:
    payload = dict(node.properties)
    payload.setdefault("label", node.label)
    payload.setdefault("entity_type", node.entity_type)
    payload.setdefault("source", node.source)
    country_code = _resolve_country_code(node)
    admin1_code = _resolve_admin1_code(node)
    if country_code:
        payload.setdefault("country_code", country_code)
    if admin1_code:
        payload.setdefault("admin1_code", admin1_code)
    return payload

def _dataset_key(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")
    return normalized or "unknown_dataset"

def _node_rank(node: ETLNode) -> tuple[float, str, str]:
    recency = 0.0
    if isinstance(node.valid_from, str) and len(node.valid_from) >= 4:
        try:
            recency = float(node.valid_from[:4])
        except ValueError:
            recency = 0.0
    completeness = 0.0
    if node.lat is not None and node.lon is not None:
        completeness += 1.0
    if node.country_code or node.properties.get("country_code") or node.properties.get("country"):
        completeness += 1.0
    if node.admin1_code or node.properties.get("admin1_code") or node.properties.get("admin1"):
        completeness += 0.5
    severity = float(node.severity or 0.0)
    return (severity + completeness + recency / 1000.0, node.entity_type, node.id)

def _select_nodes_for_budget(nodes: list[ETLNode], budget: int) -> list[ETLNode]:
    if budget <= 0 or len(nodes) <= budget:
        return nodes

    grouped: dict[str, list[ETLNode]] = defaultdict(list)
    for node in nodes:
        grouped[node.entity_type].append(node)

    ordered_groups = {
        entity_type: sorted(group, key=_node_rank, reverse=True)
        for entity_type, group in grouped.items()
    }

    selected: list[ETLNode] = []
    cursor = 0
    entity_types = list(ordered_groups.keys())
    while len(selected) < budget and entity_types:
        progressed = False
        for entity_type in entity_types:
          group = ordered_groups[entity_type]
          if cursor >= len(group):
              continue
          selected.append(group[cursor])
          progressed = True
          if len(selected) >= budget:
              break
        if not progressed:
            break
        cursor += 1

    if len(selected) < budget:
        leftovers = [node for group in ordered_groups.values() for node in group[cursor:]]
        leftovers.sort(key=_node_rank, reverse=True)
        selected.extend(leftovers[: budget - len(selected)])

    seen: set[str] = set()
    unique_selected: list[ETLNode] = []
    for node in selected:
        if node.id in seen:
            continue
        seen.add(node.id)
        unique_selected.append(node)
    return unique_selected[:budget]

def _edge_rank(edge: ETLEdge) -> tuple[float, str, str]:
    return (float(edge.confidence or 0.0), edge.relationship, f"{edge.source_id}:{edge.target_id}")

def _select_edges_for_budget(edges: list[ETLEdge], budget: int) -> list[ETLEdge]:
    if budget <= 0 or len(edges) <= budget:
        return edges

    grouped: dict[str, list[ETLEdge]] = defaultdict(list)
    for edge in edges:
        grouped[edge.relationship].append(edge)

    ordered_groups = {
        relationship: sorted(group, key=_edge_rank, reverse=True)
        for relationship, group in grouped.items()
    }

    selected: list[ETLEdge] = []
    cursor = 0
    relationships = list(ordered_groups.keys())
    while len(selected) < budget and relationships:
        progressed = False
        for relationship in relationships:
            group = ordered_groups[relationship]
            if cursor >= len(group):
                continue
            selected.append(group[cursor])
            progressed = True
            if len(selected) >= budget:
                break
        if not progressed:
            break
        cursor += 1

    if len(selected) < budget:
        leftovers = [edge for group in ordered_groups.values() for edge in group[cursor:]]
        leftovers.sort(key=_edge_rank, reverse=True)
        selected.extend(leftovers[: budget - len(selected)])

    seen: set[str] = set()
    unique_selected: list[ETLEdge] = []
    for edge in selected:
        edge_key = f"{edge.source_id}:{edge.target_id}:{edge.relationship}:{edge.source_dataset}"
        if edge_key in seen:
            continue
        seen.add(edge_key)
        unique_selected.append(edge)
    return unique_selected[:budget]

async def write_edges_to_neo4j(edges: list[ETLEdge]) -> None:
    if not edges or not neo4j_client.is_connected:
        return
    grouped: dict[str, list[ETLEdge]] = defaultdict(list)
    for edge in edges:
        if re.fullmatch(r"[A-Z][A-Z0-9_]*", edge.relationship):
            grouped[edge.relationship].append(edge)
    for relationship, group in grouped.items():
        query = f"""
        UNWIND $edges AS edge
        MATCH (a {{id: edge.source_id}}), (b {{id: edge.target_id}})
        MERGE (a)-[r:{relationship}]->(b)
        SET r.confidence = edge.confidence,
            r.lag_weeks = edge.lag_weeks,
            r.source_dataset = edge.source_dataset,
            r.evidence_type = edge.evidence_type
        """
        for index in range(0, len(group), 500):
            await neo4j_client.run(
                query,
                edges=[
                    {
                        "source_id": edge.source_id,
                        "target_id": edge.target_id,
                        "confidence": edge.confidence,
                        "lag_weeks": edge.lag_weeks,
                        "source_dataset": edge.source_dataset or "",
                        "evidence_type": edge.evidence_type,
                    }
                    for edge in group[index:index + 500]
                ],
            )

async def write_edges_to_supabase(edges: list[ETLEdge]) -> None:
    if not edges:
        return
    client = get_supabase()
    batch_size = 500
    for index in range(0, len(edges), batch_size):
        rows = [
            {
                "source_entity_id": edge.source_id,
                "target_entity_id": edge.target_id,
                "relationship_type": edge.relationship,
                "confidence_score": edge.confidence,
                "lag_weeks": edge.lag_weeks,
                "source_dataset": edge.source_dataset or "",
                "evidence_type": edge.evidence_type,
            }
            for edge in edges[index:index + batch_size]
        ]
        client.table("relationships").upsert(
            rows,
            on_conflict="source_entity_id,target_entity_id,relationship_type,source_dataset",
        ).execute()
