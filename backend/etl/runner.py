import asyncio
import sys
from loguru import logger
from config import get_settings
from db.supabase_client import get_supabase, init_supabase
from etl.base import BaseIngester, _select_edges_for_budget, write_edges_to_neo4j, write_edges_to_supabase
from etl.ingesters.agriculture.jrc_mars_agro import JRCMarsAgroIngester
from etl.ingesters.agriculture.nasa_modis_ndvi import NASAMODISNDVIIngester
from etl.ingesters.agriculture.faostat_crops import FAOSTATCropsIngester
from etl.ingesters.agriculture.usda_nass import USDANASSIngester
from etl.ingesters.climate.era5_reanalysis import ERA5ReanalysisIngester
from etl.ingesters.climate.global_flood_database import GlobalFloodDatabaseIngester
from etl.ingesters.climate.imd_rainfall import IMDRainfallIngester
from etl.ingesters.climate.noaa_gsod import NOAAGSODIngester
from etl.ingesters.climate.open_meteo import OpenMeteoIngester
from etl.ingesters.disease.idsp_india import IDSPIndiaIngester
from etl.ingesters.disease.openaq import OpenAQIngester
from etl.ingesters.disease.owid_covid import OWIDCovidIngester
from etl.ingesters.disease.promed_alerts import ProMEDAlertsIngester
from etl.ingesters.disease.who_gho import WHOGHOIngester
from etl.ingesters.ecology.copernicus_land_cover import CopernicusLandCoverIngester
from etl.ingesters.ecology.gbif import GBIFIngester
from etl.ingesters.ecology.global_forest_watch import GlobalForestWatchIngester
from etl.ingesters.ecology.iucn_red_list import IUCNRedListIngester
from etl.ingesters.ecology.nasa_firms import NASAFIRMSIngester
from etl.ingesters.geography.global_backbone import GeoBackboneIngester
from etl.ingesters.economy.imf_weo import IMFWEOIngester
from etl.ingesters.economy.mospi_india import MoSPIIndiaIngester
from etl.ingesters.economy.un_comtrade import UNComtradeIngester
from etl.ingesters.economy.fao_food_price import FAOFoodPriceIngester
from etl.ingesters.economy.world_bank import WorldBankIngester
from etl.ingesters.energy.global_carbon_project import GlobalCarbonProjectIngester
from etl.ingesters.infrastructure.acled import ACLEDIngester
from etl.ingesters.infrastructure.global_power_plants import GlobalPowerPlantsIngester
from etl.ingesters.infrastructure.hdx_humanitarian import HDXHumanitarianIngester
from etl.ingesters.infrastructure.osm_overpass import OSMOverpassIngester
from etl.ingesters.population.india_census import IndiaCensusIngester
from etl.ingesters.population.un_world_pop import UNWorldPopIngester
from etl.ingesters.population.unhcr import UNHCRIngester
from etl.ingesters.population.worldpop_gridded import WorldPopGriddedIngester
from etl.ingesters.social.undp_hdi import UNDPHDIIngester
from etl.ingesters.social.vdem_democracy import VDemDemocracyIngester
from etl.ingesters.social.wash_jmp import WASHJMPIngester
from etl.ingesters.water.copernicus_marine import CopernicusMarineIngester
from etl.ingesters.water.igrac_groundwater import IGRACGroundwaterIngester
from etl.ingesters.water.jrc_surface_water import JRCSurfaceWaterIngester
from graph.edge_rules import run_edge_rules
from graph.neo4j_client import neo4j_client
from graph.temporal_edges import build_temporal_edges
from models.graph import ETLEdge, ETLNode

CLIMATE_INGESTERS = [
    OpenMeteoIngester,
    NOAAGSODIngester,
    IMDRainfallIngester,
    ERA5ReanalysisIngester,
    GlobalFloodDatabaseIngester,
]

DISEASE_INGESTERS = [
    WHOGHOIngester,
    IDSPIndiaIngester,
    OWIDCovidIngester,
    ProMEDAlertsIngester,
    OpenAQIngester,
]

ECONOMY_INGESTERS = [
    WorldBankIngester,
    FAOFoodPriceIngester,
    IMFWEOIngester,
    MoSPIIndiaIngester,
    UNComtradeIngester,
]

AGRICULTURE_INGESTERS = [
    FAOSTATCropsIngester,
    NASAMODISNDVIIngester,
    USDANASSIngester,
    JRCMarsAgroIngester,
]

POPULATION_INGESTERS = [
    UNWorldPopIngester,
    UNHCRIngester,
    IndiaCensusIngester,
    WorldPopGriddedIngester,
]

ECOLOGY_INGESTERS = [
    GBIFIngester,
    IUCNRedListIngester,
    GlobalForestWatchIngester,
    CopernicusLandCoverIngester,
    NASAFIRMSIngester,
]

META_INGESTERS = [
    GeoBackboneIngester,
]

INFRASTRUCTURE_INGESTERS = [
    OSMOverpassIngester,
    GlobalPowerPlantsIngester,
    ACLEDIngester,
    HDXHumanitarianIngester,
]

WATER_INGESTERS = [
    IGRACGroundwaterIngester,
    JRCSurfaceWaterIngester,
    CopernicusMarineIngester,
]

ENERGY_INGESTERS = [GlobalCarbonProjectIngester]

SOCIAL_INGESTERS = [
    UNDPHDIIngester,
    VDemDemocracyIngester,
    WASHJMPIngester,
]

DOMAIN_INGESTERS = {
    "climate": CLIMATE_INGESTERS,
    "disease": DISEASE_INGESTERS,
    "economy": ECONOMY_INGESTERS,
    "agriculture": AGRICULTURE_INGESTERS,
    "ecology": ECOLOGY_INGESTERS,
    "infrastructure": INFRASTRUCTURE_INGESTERS,
    "population": POPULATION_INGESTERS,
    "water": WATER_INGESTERS,
    "energy": ENERGY_INGESTERS,
    "social": SOCIAL_INGESTERS,
    "meta": META_INGESTERS,
    "all": [
        *META_INGESTERS,
        *CLIMATE_INGESTERS,
        *DISEASE_INGESTERS,
        *ECONOMY_INGESTERS,
        *AGRICULTURE_INGESTERS,
        *POPULATION_INGESTERS,
        *ECOLOGY_INGESTERS,
        *INFRASTRUCTURE_INGESTERS,
        *WATER_INGESTERS,
        *ENERGY_INGESTERS,
        *SOCIAL_INGESTERS,
    ],
}

async def _write_cross_domain_edges(edges: list[ETLEdge]) -> int:
    if not edges:
        return 0
    logger.info(f"[cross-domain] Step 1/2: write {len(edges)} relationships to Supabase")
    await write_edges_to_supabase(edges)
    logger.info(f"[cross-domain] Step 2/2: write {len(edges)} relationships to Neo4j Aura")
    await write_edges_to_neo4j(edges)
    return len(edges)

def _load_graph_nodes() -> list[ETLNode]:
    client = get_supabase()
    rows: list[dict] = []
    offset = 0
    page_size = 1000
    max_rows = max(1000, get_settings().cross_domain_node_limit)
    while offset < max_rows:
        result = (
            client.table("metrics")
            .select("domain,entity_type,entity_id,country_code,admin1_code,lat,lon,valid_from,valid_to,source_dataset,metric_value,properties")
            .not_.is_("metric_value", "null")
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
    nodes: list[ETLNode] = []
    seen: set[str] = set()
    for row in rows:
        entity_id = row.get("entity_id")
        if not entity_id or entity_id in seen:
            continue
        seen.add(entity_id)
        properties = row.get("properties") if isinstance(row.get("properties"), dict) else {}
        label = properties.get("label") if isinstance(properties.get("label"), str) else row.get("entity_type", entity_id)
        nodes.append(
            ETLNode(
                id=entity_id,
                domain=row.get("domain", ""),
                entity_type=row.get("entity_type", ""),
                label=label,
                properties=properties,
                lat=row.get("lat"),
                lon=row.get("lon"),
                country_code=row.get("country_code"),
                admin1_code=row.get("admin1_code"),
                valid_from=row.get("valid_from"),
                valid_to=row.get("valid_to"),
                source=row.get("source_dataset", ""),
                severity=float(row.get("metric_value") or 0),
            )
        )
    return nodes

async def infer_cross_domain_edges() -> dict:
    logger.info("[cross-domain] Step 1/3: load graph nodes from Supabase")
    nodes = _load_graph_nodes()
    if len(nodes) < 2:
        return {"source": "cross_domain_inference", "nodes": len(nodes), "edges": 0}
    logger.info(f"[cross-domain] Step 2/3: infer edges from {len(nodes)} nodes")
    edges = run_edge_rules(nodes)
    edges = _select_edges_for_budget(edges, get_settings().free_tier_edge_budget)
    logger.info(f"[cross-domain] Step 3/3: persist {len(edges)} inferred edges")
    count = await _write_cross_domain_edges(edges)
    return {"source": "cross_domain_inference", "nodes": len(nodes), "edges": count}

async def infer_temporal_edges() -> dict:
    logger.info("[temporal] Step 1/2: build temporal edges from Supabase metrics")
    edges = build_temporal_edges()
    edges = _select_edges_for_budget(edges, get_settings().free_tier_edge_budget)
    logger.info(f"[temporal] Step 2/2: persist {len(edges)} temporal edges")
    count = await _write_cross_domain_edges(edges)
    return {"source": "temporal_inference", "edges": count}

async def run_domain(domain: str) -> list[dict]:
    if domain in {"relationships", "graph"}:
        logger.info("[runner] Inference 1/2: cross-domain relationships")
        inference_result = await infer_cross_domain_edges()
        logger.info(f"Completed: {inference_result}")
        logger.info("[runner] Inference 2/2: temporal relationships")
        temporal_result = await infer_temporal_edges()
        logger.info(f"Completed: {temporal_result}")
        return [inference_result, temporal_result]
    classes = DOMAIN_INGESTERS.get(domain, [])
    if not classes:
        logger.warning(f"No ingesters for domain: {domain}")
        return []
    results = []
    total = len(classes)
    for index, cls in enumerate(classes, start=1):
        logger.info(f"[runner] Ingester {index}/{total}: {cls.__name__}")
        ingester: BaseIngester = cls()
        result = await ingester.run()
        results.append(result)
        logger.info(f"Completed: {result}")
    logger.info("[runner] Inference 1/2: cross-domain relationships")
    inference_result = await infer_cross_domain_edges()
    results.append(inference_result)
    logger.info(f"Completed: {inference_result}")
    logger.info("[runner] Inference 2/2: temporal relationships")
    temporal_result = await infer_temporal_edges()
    results.append(temporal_result)
    logger.info(f"Completed: {temporal_result}")
    return results

async def main(domain: str) -> list[dict]:
    init_supabase()
    await neo4j_client.connect()
    try:
        return await run_domain(domain)
    finally:
        await neo4j_client.close()

if __name__ == "__main__":
    domain = sys.argv[1] if len(sys.argv) > 1 else "all"
    logger.info(f"Running ETL for domain: {domain}")
    results = asyncio.run(main(domain))
    for result in results:
        logger.info(result)
