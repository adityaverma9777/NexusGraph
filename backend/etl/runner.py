import asyncio
import sys
from loguru import logger
from etl.ingesters.climate.open_meteo import OpenMeteoIngester
from etl.ingesters.disease.who_gho import WHOGHOIngester
from etl.ingesters.economy.world_bank import WorldBankIngester
from etl.ingesters.ecology.gbif import GBIFIngester
from etl.ingesters.population.unhcr import UNHCRIngester

DOMAIN_INGESTERS = {
    "climate": [OpenMeteoIngester],
    "disease": [WHOGHOIngester],
    "economy": [WorldBankIngester],
    "ecology": [GBIFIngester],
    "population": [UNHCRIngester],
    "all": [OpenMeteoIngester, WHOGHOIngester, WorldBankIngester, GBIFIngester, UNHCRIngester],
}

async def run_domain(domain: str) -> list[dict]:
    classes = DOMAIN_INGESTERS.get(domain, [])
    if not classes:
        logger.warning(f"No ingesters registered for domain: {domain}")
        return []
    results = []
    for cls in classes:
        ingester = cls()
        result = await ingester.run()
        results.append(result)
        logger.info(f"Completed: {result}")
    return results

async def run_all() -> list[dict]:
    return await run_domain("all")

if __name__ == "__main__":
    domain = sys.argv[1] if len(sys.argv) > 1 else "all"
    logger.info(f"Running ETL for domain: {domain}")
    results = asyncio.run(run_domain(domain))
    for r in results:
        logger.info(r)
