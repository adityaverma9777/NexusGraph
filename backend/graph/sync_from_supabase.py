import asyncio
import json
import re

from db.supabase_client import get_supabase, init_supabase
from etl.base import write_edges_to_neo4j, write_edges_to_supabase
from graph.neo4j_client import neo4j_client
from graph.temporal_edges import build_temporal_edges
from models.graph import ETLEdge


def _chunked(items: list[dict], size: int) -> list[list[dict]]:
    if not items:
        return []
    return [items[index:index + size] for index in range(0, len(items), size)]


def _dataset_key(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")
    return normalized or "unknown_dataset"


def _load_metrics() -> list[dict]:
    client = get_supabase()
    rows: list[dict] = []
    offset = 0
    page_size = 1000
    while True:
        result = (
            client.table("metrics")
            .select("domain,entity_type,entity_id,country_code,admin1_code,lat,lon,valid_from,valid_to,source_dataset,metric_value,properties")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        batch = result.data or []
        if not batch:
            break
        rows.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
    return rows


def _load_relationships() -> list[ETLEdge]:
    client = get_supabase()
    rows: list[dict] = []
    offset = 0
    page_size = 1000
    while True:
        result = (
            client.table("relationships")
            .select("source_entity_id,target_entity_id,relationship_type,confidence_score,lag_weeks,source_dataset,evidence_type")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        batch = result.data or []
        if not batch:
            break
        rows.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
    return [
        ETLEdge(
            source_id=row["source_entity_id"],
            target_id=row["target_entity_id"],
            relationship=row["relationship_type"],
            confidence=float(row.get("confidence_score") or 0.5),
            lag_weeks=int(row.get("lag_weeks") or 0),
            source_dataset=row.get("source_dataset") or "",
            evidence_type=row.get("evidence_type") or "correlational",
        )
        for row in rows
        if row.get("source_entity_id") and row.get("target_entity_id") and row.get("relationship_type")
    ]


async def _write_nodes(rows: list[dict]) -> int:
    if not rows:
        return 0
    written = 0
    for batch in _chunked(rows, 500):
        payload = []
        for row in batch:
            entity_id = row.get("entity_id")
            entity_type = row.get("entity_type")
            if not entity_id or not entity_type:
                continue
            properties = row.get("properties") if isinstance(row.get("properties"), dict) else {}
            payload.append(
                {
                    "id": entity_id,
                    "domain": row.get("domain") or "",
                    "entity_type": entity_type,
                    "label": properties.get("label") if isinstance(properties.get("label"), str) else entity_type,
                    "lat": row.get("lat"),
                    "lon": row.get("lon"),
                    "country_code": row.get("country_code"),
                    "admin1_code": row.get("admin1_code"),
                    "severity": float(row.get("metric_value") or 0),
                    "valid_from": row.get("valid_from"),
                    "valid_to": row.get("valid_to"),
                    "source": row.get("source_dataset") or "",
                    "properties_json": json.dumps(properties, default=str),
                }
            )
        if not payload:
            continue
        await neo4j_client.run(
            """
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
                source: n.source,
                properties_json: n.properties_json
            }
            """,
            nodes=payload,
        )
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
                for item in payload
            ],
        )
        written += len(payload)
    return written


async def main() -> dict:
    init_supabase()
    await neo4j_client.connect()
    if not neo4j_client.is_connected:
        raise RuntimeError("Neo4j is not connected")
    try:
        metrics = _load_metrics()
        relationships = _load_relationships()
        temporal_edges = build_temporal_edges()
        nodes_written = await _write_nodes(metrics)
        await write_edges_to_neo4j(relationships)
        await write_edges_to_supabase(temporal_edges)
        await write_edges_to_neo4j(temporal_edges)
        return {
            "database": neo4j_client.database,
            "metric_rows": len(metrics),
            "relationship_rows": len(relationships),
            "temporal_relationship_rows": len(temporal_edges),
            "nodes_written": nodes_written,
        }
    finally:
        await neo4j_client.close()


if __name__ == "__main__":
    print(asyncio.run(main()))
