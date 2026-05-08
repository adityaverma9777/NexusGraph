from neo4j import AsyncGraphDatabase, AsyncDriver
from loguru import logger
from config import get_settings

class Neo4jClient:
    def __init__(self):
        self._driver: AsyncDriver | None = None

    async def connect(self) -> None:
        settings = get_settings()
        if not settings.neo4j_uri or not settings.neo4j_password:
            logger.warning("Neo4j credentials not set — graph queries will fail")
            return
        self._driver = AsyncGraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_username, settings.neo4j_password),
        )
        await self._driver.verify_connectivity()
        logger.info("Neo4j connected")

    async def close(self) -> None:
        if self._driver:
            await self._driver.close()
            logger.info("Neo4j closed")

    async def run(self, query: str, **params) -> list[dict]:
        if not self._driver:
            return []
        async with self._driver.session() as session:
            result = await session.run(query, **params)
            records = await result.data()
            return records

    async def run_single(self, query: str, **params) -> dict | None:
        rows = await self.run(query, **params)
        return rows[0] if rows else None

    @property
    def is_connected(self) -> bool:
        return self._driver is not None

neo4j_client = Neo4jClient()
