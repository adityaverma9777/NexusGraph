from urllib.parse import urlparse

import httpx
from neo4j import AsyncDriver, AsyncGraphDatabase
from loguru import logger

from config import get_settings


class Neo4jClient:
    def __init__(self):
        self._driver: AsyncDriver | None = None
        self._http_client: httpx.AsyncClient | None = None
        self._query_endpoint = ""
        self._database = ""
        self._auth: tuple[str, str] | None = None

    def _resolve_database(self, uri: str, configured: str) -> str:
        if configured:
            return configured
        host = urlparse(uri).hostname or ""
        if host.endswith(".databases.neo4j.io"):
            name = host.split(".", 1)[0].strip()
            if name:
                return name
        return "neo4j"

    def _build_query_endpoint(self, uri: str, database: str) -> str:
        parsed = urlparse(uri)
        host = parsed.hostname or ""
        if not host:
            return ""
        return f"https://{host}/db/{database}/query/v2"

    async def _connect_bolt(self, uri: str, auth: tuple[str, str]) -> bool:
        driver = AsyncGraphDatabase.driver(uri, auth=auth)
        try:
            async with driver.session(database=self._database) as session:
                result = await session.run("RETURN 1 AS ok")
                await result.consume()
            self._driver = driver
            logger.info(f"Neo4j connected via Bolt to database '{self._database}'")
            return True
        except Exception:
            await driver.close()
            raise

    async def _ensure_http_client(self) -> httpx.AsyncClient:
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(
                auth=self._auth,
                timeout=60.0,
                headers={"Accept": "application/json"},
            )
        return self._http_client

    async def _run_http(self, query: str, **params) -> list[dict]:
        client = await self._ensure_http_client()
        response = await client.post(
            self._query_endpoint,
            json={"statement": query, "parameters": params},
        )
        payload = response.json()
        errors = payload.get("errors") if isinstance(payload, dict) else None
        if response.status_code >= 400 or errors:
            detail = errors[0].get("message") if errors and isinstance(errors[0], dict) else response.text
            raise RuntimeError(detail)
        data = payload.get("data") if isinstance(payload, dict) else None
        if not isinstance(data, dict):
            return []
        fields = data.get("fields")
        values = data.get("values")
        if not isinstance(fields, list) or not isinstance(values, list):
            return []
        rows: list[dict] = []
        for row in values:
            if not isinstance(row, list):
                continue
            rows.append({str(field): value for field, value in zip(fields, row)})
        return rows

    async def connect(self) -> None:
        settings = get_settings()
        if not settings.neo4j_uri or not settings.neo4j_password:
            logger.warning("Neo4j credentials not set - graph queries will fail")
            return
        self._database = self._resolve_database(settings.neo4j_uri, settings.neo4j_database)
        self._query_endpoint = self._build_query_endpoint(settings.neo4j_uri, self._database)
        self._auth = (settings.neo4j_username, settings.neo4j_password)
        try:
            if await self._connect_bolt(settings.neo4j_uri, self._auth):
                try:
                    await self.run("CREATE CONSTRAINT IF NOT EXISTS FOR (n:Entity) REQUIRE n.id IS UNIQUE")
                    logger.info("Neo4j constraint Entity(id) verified.")
                except Exception as e:
                    logger.warning(f"Failed to verify Neo4j constraint: {e}")
                return
        except Exception as exc:
            logger.warning(f"Neo4j Bolt unavailable - trying Query API: {exc}")
            if self._driver:
                await self._driver.close()
            self._driver = None
        try:
            await self._run_http("RETURN 1 AS ok")
            logger.info(f"Neo4j connected via Query API to database '{self._database}'")
            try:
                await self.run("CREATE CONSTRAINT IF NOT EXISTS FOR (n:Entity) REQUIRE n.id IS UNIQUE")
                logger.info("Neo4j constraint Entity(id) verified.")
            except Exception as e:
                logger.warning(f"Failed to verify Neo4j constraint via HTTP: {e}")
        except Exception as exc:
            logger.warning(f"Neo4j unavailable - continuing without graph connectivity: {exc}")
            if self._http_client:
                await self._http_client.aclose()
            self._http_client = None
            self._query_endpoint = ""
            self._auth = None

    async def close(self) -> None:
        if self._driver:
            await self._driver.close()
            self._driver = None
        if self._http_client:
            await self._http_client.aclose()
            self._http_client = None
        if self.is_connected:
            logger.info("Neo4j closed")
        self._query_endpoint = ""
        self._auth = None

    async def run(self, query: str, **params) -> list[dict]:
        if self._driver:
            async with self._driver.session(database=self._database) as session:
                result = await session.run(query, **params)
                records = await result.data()
                return records
        if not self._query_endpoint or not self._auth:
            return []
        return await self._run_http(query, **params)

    async def run_single(self, query: str, **params) -> dict | None:
        rows = await self.run(query, **params)
        return rows[0] if rows else None

    @property
    def database(self) -> str:
        return self._database

    @property
    def is_connected(self) -> bool:
        return self._driver is not None or bool(self._query_endpoint and self._auth)


neo4j_client = Neo4jClient()
