from abc import ABC, abstractmethod
from typing import Optional
from loguru import logger
from models.graph import ETLNode, ETLEdge
from db.supabase_client import get_supabase
from graph.neo4j_client import neo4j_client

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
        logger.info(f"[{self.source_name}] Starting ingestion")
        try:
            raw = await self.fetch()
            logger.info(f"[{self.source_name}] Fetched {len(raw)} raw records")
            nodes = self.transform(raw)
            logger.info(f"[{self.source_name}] Transformed to {len(nodes)} nodes")
            edges = self.infer_edges(nodes)
            logger.info(f"[{self.source_name}] Inferred {len(edges)} edges")
            await self._write_nodes_to_supabase(nodes)
            await self._write_nodes_to_neo4j(nodes)
            await self._write_edges_to_neo4j(edges)
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
                "metric_name": "severity",
                "metric_value": n.severity,
                "unit": "score",
                "valid_from": n.valid_from or "1970-01-01",
                "valid_to": n.valid_to,
                "source_dataset": n.source,
                "properties": n.properties,
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
            severity: n.severity,
            valid_from: n.valid_from,
            valid_to: n.valid_to,
            source: n.source
        }
        SET node.properties = n.properties_json
        """
        node_dicts = [
            {
                "id": n.id,
                "domain": n.domain,
                "entity_type": n.entity_type,
                "label": n.label,
                "lat": n.lat,
                "lon": n.lon,
                "severity": n.severity,
                "valid_from": n.valid_from,
                "valid_to": n.valid_to,
                "source": n.source,
                "properties_json": str(n.properties),
            }
            for n in nodes
        ]
        await neo4j_client.run(query, nodes=node_dicts)

    async def _write_edges_to_neo4j(self, edges: list[ETLEdge]) -> None:
        if not edges or not neo4j_client.is_connected:
            return
        for edge in edges:
            rel_query = f"""
            MATCH (a {{id: $source_id}}), (b {{id: $target_id}})
            MERGE (a)-[r:{edge.relationship}]->(b)
            SET r.confidence = $confidence,
                r.lag_weeks = $lag_weeks,
                r.source_dataset = $source_dataset,
                r.evidence_type = $evidence_type
            """
            await neo4j_client.run(
                rel_query,
                source_id=edge.source_id,
                target_id=edge.target_id,
                confidence=edge.confidence,
                lag_weeks=edge.lag_weeks,
                source_dataset=edge.source_dataset,
                evidence_type=edge.evidence_type,
            )

    async def _update_registry(self, record_count: int) -> None:
        try:
            client = get_supabase()
            client.table("dataset_registry").upsert(
                {
                    "name": self.source_name,
                    "domain": self.domain,
                    "record_count": record_count,
                    "last_ingested_at": "now()",
                    "is_active": True,
                },
                on_conflict="name",
            ).execute()
        except Exception as exc:
            logger.warning(f"Registry update failed: {exc}")
