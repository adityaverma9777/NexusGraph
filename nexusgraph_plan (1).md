# NexusGraph: Full Implementation Plan
## A Mini-Palantir Multi-Domain Open Intelligence Relationship Engine

---

## Table of Contents

1. [Project Overview & Architecture Philosophy](#1-project-overview--architecture-philosophy)
2. [Full Technology Stack (100% Free Tier)](#2-full-technology-stack-100-free-tier)
3. [Complete Dataset Registry (30+ Sources)](#3-complete-dataset-registry-30-sources)
4. [Data Ingestion & ETL Pipeline](#4-data-ingestion--etl-pipeline)
5. [Database Schema & Graph Modeling](#5-database-schema--graph-modeling)
6. [Backend Architecture](#6-backend-architecture)
7. [Frontend Architecture & UI Components](#7-frontend-architecture--ui-components)
8. [Graph Relationship Engine](#8-graph-relationship-engine)
9. [AI Intelligence Briefing System](#9-ai-intelligence-briefing-system)
10. [Maps, Heatmaps & Geospatial Layer](#10-maps-heatmaps--geospatial-layer)
11. [Real-Time & Timeline Systems](#11-real-time--timeline-systems)
12. [Deployment Architecture (Free Tier)](#12-deployment-architecture-free-tier)
13. [Development Phases & Timeline](#13-development-phases--timeline)
14. [Data Flow Diagrams](#14-data-flow-diagrams)
15. [Portfolio Showcase Checklist](#15-portfolio-showcase-checklist)

---

## 1. Project Overview & Architecture Philosophy

NexusGraph is built on one foundational idea: **every data point is a node, every correlation is an edge**. Instead of isolated dashboards, all public datasets are ingested into a unified property graph where entities from different domains — rainfall in Kerala, dengue cases in Tamil Nadu, rice prices in Punjab, and migration in Mumbai — become first-class connected citizens.

### Core Design Principles

**Relationship-First Storage**: Data is stored not just as rows in tables but as graph edges with weights, confidence scores, temporal validity, and domain tags. A Neo4j graph database acts as the relationship brain. PostgreSQL acts as the raw metrics store.

**Domain Separation with Cross-Domain Bridges**: Each domain (Climate, Disease, Economy, Ecology, Human Systems, Infrastructure) maintains its own entity namespace, but bridge tables/edges connect cross-domain influences with typed relationship labels such as `DRIVES`, `CORRELATES_WITH`, `PRECEDES`, `WEAKENS`, and `AMPLIFIES`.

**Confidence Scoring on Every Edge**: Because this is correlation intelligence and not proven causation, every graph edge carries a `confidence_score` (0.0–1.0), a `lag_weeks` field (how many weeks before one thing affects another), and a `source_dataset` reference. This is what separates NexusGraph from a toy project.

**Time as a First-Class Dimension**: All data points carry `valid_from` and `valid_to` timestamps. The timeline slider queries the graph at any historical snapshot, letting users replay 10 years of systemic evolution.

---

## 2. Full Technology Stack (100% Free Tier)

Every component listed here has a free tier sufficient for development, demo, and portfolio showcase.

### Frontend

| Component | Technology | Free Tier |
|-----------|-----------|-----------|
| Framework | React 18 + TypeScript | Free (open source) |
| Graph Visualization | Cytoscape.js | Free (open source) |
| Geographic Maps | Leaflet.js + React-Leaflet | Free (open source) |
| Heatmaps | Leaflet.heat plugin | Free (open source) |
| Charts & Time Series | Recharts + D3.js | Free (open source) |
| UI Component Library | shadcn/ui + Tailwind CSS | Free (open source) |
| State Management | Zustand | Free (open source) |
| Data Fetching | TanStack Query (React Query) | Free (open source) |
| Build Tool | Vite | Free (open source) |
| Map Tiles | OpenStreetMap (via Leaflet) | Free forever |
| Satellite Tiles | CARTO (free tier, 75k requests/month) | Free tier |
| Hosting | Vercel (Hobby plan) | Free: 100GB bandwidth/month |

### Backend

| Component | Technology | Free Tier |
|-----------|-----------|-----------|
| API Framework | FastAPI (Python) | Free (open source) |
| Graph Database | Neo4j AuraDB | Free: 200MB, 1 instance |
| Relational DB | Supabase (PostgreSQL) | Free: 500MB, unlimited API calls |
| Time-Series Cache | Upstash Redis | Free: 10,000 commands/day |
| ETL Scheduler | GitHub Actions (cron) | Free: 2,000 min/month |
| Background Jobs | Celery + Redis | Free (open source + Upstash) |
| API Hosting | Render.com | Free: 750 hours/month |
| Object Storage (raw data) | Supabase Storage | Free: 1GB |
| Authentication | Supabase Auth | Free: unlimited |

### AI & Intelligence Layer

| Component | Technology | Free Tier |
|-----------|-----------|-----------|
| Intelligence Briefings | Groq API (LLaMA 3) | Free: 14,400 req/day |
| Embeddings | Ollama (local) or HuggingFace Inference | Free |
| Alternative LLM | Google Gemini 1.5 Flash API | Free: 1,500 req/day |
| Fallback | Anthropic Claude API | Pay-per-use (minimal cost) |

### DevOps & Monitoring

| Component | Technology | Free Tier |
|-----------|-----------|-----------|
| Version Control | GitHub | Free |
| CI/CD | GitHub Actions | Free: 2,000 min/month |
| Monitoring | Grafana Cloud | Free: 10,000 metrics/month |
| Error Tracking | Sentry | Free: 5,000 errors/month |
| API Documentation | FastAPI auto-docs (Swagger) | Free (built-in) |

---

## 3. Complete Dataset Registry (30+ Sources)

All datasets listed here are publicly available, free to use, and have documented APIs or downloadable CSV/JSON files. Each entry includes the exact API endpoint or download URL, update frequency, and how it connects to other domains.

---

### DOMAIN 1: CLIMATE & WEATHER SYSTEMS

#### Dataset 1.1 — Open-Meteo Historical Weather API
- **URL**: `https://archive-api.open-meteo.com/v1/archive`
- **Format**: JSON REST API (no key required)
- **Coverage**: Global, any lat/lon coordinate, 1940–present
- **Variables**: Daily temperature max/min/mean, precipitation sum, wind speed, humidity, solar radiation, evapotranspiration
- **Update Frequency**: Daily
- **Resolution**: 11km grid cells
- **Graph Nodes Created**: `ClimateEvent`, `WeatherAnomaly`, `RainfallZone`
- **Key Relationships**:
  - High rainfall → `DRIVES` → `MosquitoBreedingCondition`
  - Drought anomaly → `DRIVES` → `CropStressEvent`
  - Temperature spike → `CORRELATES_WITH` → `HeatRelatedMortality`
- **Sample API Call**:
  ```
  GET https://archive-api.open-meteo.com/v1/archive?latitude=12.97&longitude=77.59&start_date=2020-01-01&end_date=2024-12-31&daily=temperature_2m_max,precipitation_sum&timezone=Asia%2FKolkata
  ```

#### Dataset 1.2 — NOAA Global Surface Summary of Day (GSOD)
- **URL**: `https://www.ncei.noaa.gov/access/services/data/v1?dataset=global-summary-of-the-day`
- **Format**: CSV via NOAA CDO API (free API key from ncdc.noaa.gov)
- **Coverage**: 9,000+ weather stations worldwide
- **Variables**: Temperature, dew point, wind speed, precipitation, snow depth, visibility
- **Update Frequency**: Daily
- **Graph Nodes Created**: `WeatherStation`, `TemperatureRecord`
- **Use Case**: Cross-validate Open-Meteo with ground station data for India-specific accuracy

#### Dataset 1.3 — IMD (India Meteorological Department) Gridded Rainfall
- **URL**: `https://imdpune.gov.in/cmpg/Griddata/Rainfall_25_NetCDF.html`
- **Format**: NetCDF files (downloadable, free registration)
- **Coverage**: India, 0.25° × 0.25° grid
- **Variables**: Daily rainfall from 1901–present
- **Graph Nodes Created**: `IndiaRainfallGrid`, `MonsoonEvent`, `DroughtZone`
- **Key Relationships**:
  - Deficit rainfall → `DRIVES` → `ReservoirDepletion`
  - Excess rainfall → `AMPLIFIES` → `FloodRisk`

#### Dataset 1.4 — Copernicus Climate Data Store (ERA5)
- **URL**: `https://cds.climate.copernicus.eu/api/v2` (free registration required)
- **Format**: NetCDF/GRIB via Python `cdsapi`
- **Coverage**: Global, 0.25° grid, 1940–present
- **Variables**: Soil moisture, wind patterns, sea surface temperature, humidity, cloud cover
- **Use Case**: Advanced climate correlation with disease and agriculture nodes
- **Graph Nodes Created**: `AtmosphericCondition`, `SoilMoistureZone`

#### Dataset 1.5 — Global Flood Database (GFD) / DFO Flood Observatory
- **URL**: `https://global-flood-database.cloudtostreet.ai/` (free academic access)
- **Alternative**: `https://floodobservatory.colorado.edu/Archives/index.html` (CSV downloads)
- **Format**: CSV, shapefile
- **Coverage**: Global flood events 1985–present
- **Variables**: Flood date, duration, area affected, displaced persons, severity
- **Graph Nodes Created**: `FloodEvent`, `DisplacementEvent`
- **Key Relationships**:
  - Flood event → `CAUSES` → `CropLoss`
  - Flood event → `DRIVES` → `WaterborneDisease`
  - Flood event → `TRIGGERS` → `MigrationWave`

---

### DOMAIN 2: DISEASE & EPIDEMIOLOGY SYSTEMS

#### Dataset 2.1 — WHO Global Health Observatory (GHO) API
- **URL**: `https://ghoapi.azureedge.net/api/`
- **Format**: OData REST API (no key required)
- **Coverage**: 194 countries, 2000–present
- **Variables**: Malaria cases, dengue incidence, tuberculosis, cholera, respiratory disease mortality, maternal mortality, life expectancy
- **Update Frequency**: Annual
- **Graph Nodes Created**: `DiseaseOutbreak`, `MortalityIndicator`, `HealthSystemStress`
- **Key Relationships**:
  - High dengue → `STRESSES` → `HealthcareSystem`
  - High malaria → `REDUCES` → `AgriculturalProductivity`
- **Sample API Call**:
  ```
  GET https://ghoapi.azureedge.net/api/MALARIA_EST_CASES?$filter=SpatialDim eq 'IND'
  ```

#### Dataset 2.2 — IDSP (India Integrated Disease Surveillance Programme) — via data.gov.in
- **URL**: `https://api.data.gov.in/resource/` (free API key at data.gov.in)
- **Format**: JSON API
- **Coverage**: India, state-level, 2010–present
- **Variables**: Dengue, malaria, chikungunya, Japanese encephalitis, cholera, typhoid — weekly case counts
- **Graph Nodes Created**: `IndiaEpidemicEvent`, `VectorBorneOutbreak`

#### Dataset 2.3 — Our World in Data COVID-19 Complete Dataset
- **URL**: `https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/owid-covid-data.csv`
- **Format**: CSV (direct download, updated daily)
- **Coverage**: 207 countries, 2020–2023
- **Variables**: Cases, deaths, hospitalizations, ICU, vaccinations, excess mortality, GDP impact
- **Graph Nodes Created**: `PandemicEvent`, `VaccinationCoverage`
- **Key Relationships**:
  - High COVID mortality → `REDUCES` → `EconomicOutput`
  - Low vaccination → `AMPLIFIES` → `OutbreakSeverity`

#### Dataset 2.4 — Global Infectious Diseases and Epidemiology Network (GIDEON)
- **URL**: Free tier: `ProMED mail` RSS feeds at `https://promedmail.org/promed-rss/`
- **Format**: RSS/XML feed
- **Coverage**: Global real-time disease alerts
- **Update Frequency**: Near real-time (multiple times per day)
- **Use Case**: Real-time disease signal detection for the alert system

#### Dataset 2.5 — Air Quality and Respiratory Disease: OpenAQ
- **URL**: `https://api.openaq.org/v3/` (free API key)
- **Format**: JSON REST API
- **Coverage**: 100+ countries, 10,000+ air quality stations
- **Variables**: PM2.5, PM10, NO2, O3, CO, SO2 — hourly/daily readings
- **Rate Limit**: 10,000 requests/month free
- **Graph Nodes Created**: `AirPollutionEvent`, `PollutantLevel`
- **Key Relationships**:
  - High PM2.5 → `DRIVES` → `RespiratoryDiseaseIncidence`
  - Industrial pollution → `CORRELATES_WITH` → `CancerMortality`
  - Poor air quality → `REDUCES` → `WorkerProductivity`

---

### DOMAIN 3: ECONOMIC & FINANCIAL SYSTEMS

#### Dataset 3.1 — World Bank Open Data API
- **URL**: `https://api.worldbank.org/v2/country/{country}/indicator/{indicator}?format=json`
- **Format**: JSON REST API (no key required)
- **Coverage**: 217 countries, 1960–present
- **Key Indicators**:
  - `NY.GDP.MKTP.CD` — GDP (current US$)
  - `SL.UEM.TOTL.ZS` — Unemployment rate
  - `FP.CPI.TOTL.ZG` — Inflation (CPI)
  - `SI.POV.GINI` — GINI inequality index
  - `SH.XPD.CHEX.GD.ZS` — Health expenditure % of GDP
  - `AG.PRD.FOOD.XD` — Food production index
  - `NE.EXP.GNFS.ZS` — Exports % of GDP
- **Update Frequency**: Annual
- **Graph Nodes Created**: `EconomicIndicator`, `CountryEconomy`, `FoodPriceEvent`
- **Key Relationships**:
  - High unemployment → `DRIVES` → `InternalMigration`
  - Low food production → `INCREASES` → `FoodInsecurity`
  - High inflation → `AMPLIFIES` → `PovertyRate`

#### Dataset 3.2 — FAO Food Price Index (FFPI)
- **URL**: `https://www.fao.org/faostat/en/#data/CP` (downloadable CSV)
- **Direct API**: `http://fenixservices.fao.org/faostat/api/v1/en/data/`
- **Format**: CSV, JSON API
- **Coverage**: Global, monthly 1990–present
- **Variables**: Cereal price index, dairy, meat, oils, sugar — monthly price indices
- **Graph Nodes Created**: `FoodPriceIndex`, `CommodityPrice`
- **Key Relationships**:
  - Wheat price spike → `CAUSES` → `FoodInsecurityEvent`
  - Food price index rise → `AMPLIFIES` → `MalnutritionRate`

#### Dataset 3.3 — IMF World Economic Outlook Database
- **URL**: `https://www.imf.org/en/Publications/WEO/weo-database/` (downloadable)
- **Format**: Excel/CSV direct download
- **Coverage**: 190 countries, 1980–2029 (including forecasts)
- **Variables**: Real GDP growth, current account balance, debt % GDP, inflation projections
- **Graph Nodes Created**: `MacroeconomicForecast`, `DebtStressIndicator`

#### Dataset 3.4 — India Ministry of Statistics (MoSPI) via data.gov.in
- **URL**: `https://api.data.gov.in/resource/` (free API key)
- **Format**: JSON, CSV
- **Coverage**: India, state-level
- **Variables**: State GDP, employment, CPI, IIP (industrial production), agricultural wages
- **Graph Nodes Created**: `IndiaStateEconomy`, `AgricultureWage`

#### Dataset 3.5 — COMTRADE (UN) Trade Data
- **URL**: `https://comtradeapi.un.org/data/v1/get/` (free tier: 500 requests/hour)
- **Format**: JSON API (free API key at comtrade.un.org)
- **Coverage**: 200+ countries bilateral trade, 1962–present
- **Variables**: Import/export volumes by commodity code (HS codes)
- **Graph Nodes Created**: `TradeFlow`, `CommodityExport`
- **Key Relationships**:
  - Collapse in agricultural exports → `CORRELATES_WITH` → `RuralUnemployment`

---

### DOMAIN 4: AGRICULTURAL & FOOD SYSTEMS

#### Dataset 4.1 — FAOSTAT Agricultural Data
- **URL**: `http://fenixservices.fao.org/faostat/api/v1/en/data/QCL` (Crops & Livestock)
- **Format**: JSON API (no key required)
- **Coverage**: 245 countries, 1961–present
- **Variables**: Crop production (tonnes), yield (hg/ha), harvested area for 170+ crops including rice, wheat, maize, sugarcane, cotton, vegetables
- **Update Frequency**: Annual
- **Graph Nodes Created**: `CropProduction`, `YieldAnomaly`, `CropCalendar`
- **Key Relationships**:
  - Low rainfall → `REDUCES` → `CropYield`
  - Crop failure → `TRIGGERS` → `FoodPriceSpike`
  - Crop failure → `CAUSES` → `RuralMigration`

#### Dataset 4.2 — NASA MODIS Vegetation Index (NDVI) via NASA EarthData
- **URL**: `https://appeears.earthdatacloud.nasa.gov/api/` (free NASA EarthData account)
- **Format**: GeoTIFF, CSV via API
- **Coverage**: Global, 500m resolution, 2000–present
- **Variables**: NDVI (vegetation health), EVI (enhanced vegetation index) — 16-day composites
- **Graph Nodes Created**: `VegetationHealthZone`, `DroughtStressArea`
- **Key Relationships**:
  - NDVI decline → `SIGNALS` → `CropStress`
  - NDVI decline + low rainfall → `AMPLIFIES` → `DesertificationRisk`

#### Dataset 4.3 — USDA NASS (National Agricultural Statistics Service)
- **URL**: `https://quickstats.nass.usda.gov/api/` (free API key)
- **Format**: JSON
- **Coverage**: USA (use for global comparative benchmarks)
- **Variables**: Crop yields, planting progress, livestock numbers, farm prices
- **Note**: Used for global price benchmarking; combine with FAOSTAT for India-specific values

#### Dataset 4.4 — Global Crop Monitor (JRC-MARS)
- **URL**: `https://mars.jrc.ec.europa.eu/mars/About-us/AGRI4CAST/Data-portal`
- **Format**: CSV, GIS shapefiles (free download)
- **Coverage**: Global crop calendars, agrometeorological indicators
- **Variables**: Crop water stress, soil moisture, growing degree days
- **Graph Nodes Created**: `AgroMeteorologyZone`, `CropWaterDeficit`

---

### DOMAIN 5: POPULATION & HUMAN MIGRATION

#### Dataset 5.1 — UN World Population Prospects API
- **URL**: `https://population.un.org/dataportal/api/` (free, no key)
- **Format**: JSON REST API
- **Coverage**: 237 countries, 1950–2100 (projections)
- **Variables**: Population by age/sex, birth rate, death rate, net migration rate, urbanization rate
- **Graph Nodes Created**: `PopulationSnapshot`, `DemographicTrend`, `UrbanizationRate`
- **Key Relationships**:
  - High population density + poor sanitation → `AMPLIFIES` → `DiseaseOutbreakRisk`
  - Rapid urbanization → `CORRELATES_WITH` → `InformalSettlementGrowth`

#### Dataset 5.2 — UNHCR Refugee & Displacement Data
- **URL**: `https://api.unhcr.org/population/v1/` (free, no key)
- **Format**: JSON REST API
- **Coverage**: Global, 2000–present
- **Variables**: Refugees by origin and asylum country, IDPs (internally displaced), asylum seekers, stateless persons
- **Update Frequency**: Annual (quarterly for major crises)
- **Graph Nodes Created**: `RefugeeFlow`, `DisplacementEvent`, `AsylumSeeker`
- **Key Relationships**:
  - Conflict + drought → `TRIGGERS` → `ForcedDisplacement`
  - Displacement → `STRAINS` → `HostCountryHealthSystem`

#### Dataset 5.3 — India Census 2011 + NPR Migration Data (data.gov.in)
- **URL**: `https://api.data.gov.in/resource/` (free API key)
- **Variables**: District-level population, literacy, migration reasons, urban/rural split
- **Graph Nodes Created**: `IndiaDistrictDemographic`, `InternalMigrantFlow`

#### Dataset 5.4 — WorldPop Gridded Population (University of Southampton)
- **URL**: `https://hub.worldpop.org/geodata/listing?id=29` (free download)
- **Format**: GeoTIFF (100m resolution)
- **Coverage**: Global, annual 2000–2020
- **Variables**: Population density per 100m grid cell
- **Use Case**: Overlay with disease and flood nodes on the heatmap layer
- **Graph Nodes Created**: `PopulationDensityGrid`

---

### DOMAIN 6: ECOLOGICAL & BIODIVERSITY SYSTEMS

#### Dataset 6.1 — GBIF (Global Biodiversity Information Facility) API
- **URL**: `https://api.gbif.org/v1/occurrence/search` (free, no key)
- **Format**: JSON REST API
- **Coverage**: 2.3 billion occurrence records, global
- **Variables**: Species occurrence by lat/lon, date, habitat type
- **Rate Limit**: Unlimited (with registration: bulk downloads)
- **Graph Nodes Created**: `SpeciesOccurrence`, `BiodiversityIndex`, `WildlifeShiftEvent`
- **Key Relationships**:
  - Climate warming → `SHIFTS` → `SpeciesRange`
  - Deforestation → `REDUCES` → `BiodiversityIndex`
  - Wildlife displacement → `AMPLIFIES` → `ZoonoticDiseaseRisk`

#### Dataset 6.2 — IUCN Red List API
- **URL**: `https://apiv3.iucnredlist.org/api/v3/` (free API key at iucnredlist.org)
- **Format**: JSON
- **Variables**: Species conservation status, threats, habitat type, population trend
- **Graph Nodes Created**: `EndangeredSpecies`, `HabitatLossEvent`

#### Dataset 6.3 — Global Forest Watch (Hansen/UMD via GEE)
- **URL**: `https://www.globalforestwatch.org/help/map/guides/` + GEE API
- **Alternative direct download**: `https://storage.googleapis.com/earthenginepartners-hansen/` (free)
- **Format**: GeoTIFF, CSV summaries
- **Coverage**: Global, annual 2000–2023
- **Variables**: Tree cover loss (hectares), gain, primary forest loss, fire alerts
- **Graph Nodes Created**: `DeforestationEvent`, `ForestCoverChange`, `FireAlert`
- **Key Relationships**:
  - Deforestation → `DRIVES` → `WildlifeDisplacement`
  - Deforestation + humidity → `INCREASES` → `ZoonoticSpilloverRisk`
  - Forest loss → `REDUCES` → `CarbonSequestration`

#### Dataset 6.4 — Copernicus Global Land Service — Land Cover
- **URL**: `https://land.copernicus.eu/global/products/lc` (free, registration)
- **Format**: NetCDF, GeoTIFF
- **Coverage**: Global, annual 1992–2022, 300m resolution
- **Variables**: Land cover class (cropland, urban, forest, wetland, bare soil)
- **Graph Nodes Created**: `LandCoverChange`, `UrbanExpansionZone`

#### Dataset 6.5 — NASA Fire Information for Resource Management (FIRMS)
- **URL**: `https://firms.modaps.eosdis.nasa.gov/api/` (free API key)
- **Format**: CSV, GeoJSON
- **Coverage**: Global, near real-time (within 3 hours)
- **Variables**: Active fire location, fire radiative power, confidence, brightness temperature
- **Update Frequency**: Near real-time
- **Graph Nodes Created**: `WildfireEvent`, `AirQualityImpact`
- **Key Relationships**:
  - Wildfire → `CAUSES` → `AirPollutionSpike`
  - Wildfire + deforestation → `AMPLIFIES` → `CO2Emission`

---

### DOMAIN 7: INFRASTRUCTURE & URBAN SYSTEMS

#### Dataset 7.1 — OpenStreetMap (OSM) via Overpass API
- **URL**: `https://overpass-api.de/api/interpreter` (free, no key)
- **Format**: JSON/XML
- **Coverage**: Global, community-maintained
- **Variables**: Hospitals, schools, roads, power lines, water bodies, urban boundaries, bridges
- **Graph Nodes Created**: `Hospital`, `School`, `CriticalInfrastructure`, `RoadNetwork`
- **Key Relationships**:
  - Flood zone + road density → `DETERMINES` → `ReliefAccessibility`
  - Hospital density → `MITIGATES` → `DiseaseOutbreakImpact`

#### Dataset 7.2 — Global Power Plant Database (WRI)
- **URL**: `https://datasets.wri.org/dataset/globalpowerplantdatabase` (free CSV download)
- **Format**: CSV
- **Coverage**: 35,000 power plants globally
- **Variables**: Plant type (coal, solar, wind, hydro), capacity (MW), country, lat/lon, commissioning year
- **Graph Nodes Created**: `PowerPlant`, `EnergySource`, `GridNode`
- **Key Relationships**:
  - Drought → `REDUCES` → `HydropowerGeneration`
  - Coal plant density → `DRIVES` → `RegionalAirPollution`

#### Dataset 7.3 — ACLED (Armed Conflict Location & Event Data)
- **URL**: `https://developer.acleddata.com/` (free academic/research registration)
- **Format**: CSV, JSON API
- **Coverage**: 215 countries/territories, 1997–present
- **Variables**: Conflict events (battles, explosions, protests, riots), fatalities, actor types, location
- **Update Frequency**: Weekly
- **Graph Nodes Created**: `ConflictEvent`, `InstabilityIndicator`, `ProtestEvent`
- **Key Relationships**:
  - Food insecurity → `AMPLIFIES` → `SocialUnrest`
  - Conflict → `TRIGGERS` → `MigrationWave`
  - Conflict + disease → `COLLAPSES` → `HealthcareInfrastructure`

#### Dataset 7.4 — Humanitarian Data Exchange (HDX) via OCHA
- **URL**: `https://data.humdata.org/api/3/` (CKAN API, free, no key)
- **Format**: JSON, CSV
- **Coverage**: Global humanitarian datasets, 250+ countries
- **Variables**: Food security classifications (IPC), humanitarian needs assessments, water/sanitation access
- **Graph Nodes Created**: `HumanitarianNeed`, `IPCPhaseClassification`, `WaterAccessZone`

---

### DOMAIN 8: WATER & OCEAN SYSTEMS

#### Dataset 8.1 — Global Groundwater Information System (GGIS) / IGRAC
- **URL**: `https://www.un-igrac.org/resource/` (free download)
- **Format**: CSV, GIS shapefile
- **Variables**: Groundwater depletion rate, aquifer stress level, transboundary aquifer boundaries
- **Graph Nodes Created**: `AquiferStressZone`, `GroundwaterDepletion`
- **Key Relationships**:
  - Groundwater depletion → `REDUCES` → `IrrigationCapacity`
  - Over-extraction → `CAUSES` → `LandSubsidence`

#### Dataset 8.2 — JRC Global Surface Water Explorer
- **URL**: `https://global-surface-water.appspot.com/download` (free via Google Earth Engine)
- **Format**: GeoTIFF
- **Coverage**: Global, 1984–2021, 30m resolution
- **Variables**: Water occurrence, recurrence, seasonality, transitions, maximum water extent
- **Graph Nodes Created**: `SurfaceWaterBody`, `ReservoirLevel`

#### Dataset 8.3 — Copernicus Marine Service (CMEMS)
- **URL**: `https://marine.copernicus.eu/` (free registration)
- **Format**: NetCDF via API
- **Variables**: Sea surface temperature, sea level anomaly, ocean salinity, chlorophyll (algae bloom indicator)
- **Graph Nodes Created**: `OceanTemperatureAnomaly`, `SeaLevelAnomaly`
- **Key Relationships**:
  - Ocean warming → `SHIFTS` → `FisheryZones`
  - El Niño signal → `PREDICTS` → `MonsoonsWeakening`

---

### DOMAIN 9: ENERGY & EMISSIONS

#### Dataset 9.1 — Global Carbon Project (GCP) CO2 Data
- **URL**: `https://globalcarbonproject.org/carbonbudget/` (free download)
- **Alternative**: `https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv`
- **Format**: CSV (direct URL)
- **Coverage**: Global, country-level, 1750–present
- **Variables**: CO2 emissions (total, per capita, by sector), CH4, N2O, cumulative emissions
- **Graph Nodes Created**: `EmissionSource`, `CarbonBudget`, `GHGIndicator`

#### Dataset 9.2 — IEA World Energy Balances (via OECD)
- **URL**: `https://stats.oecd.org/sdmx-json/data/` (some free via OECD API)
- **Format**: JSON SDMX
- **Variables**: Energy production/consumption by source (coal, oil, gas, renewables), energy intensity
- **Graph Nodes Created**: `EnergyMix`, `FossilFuelDependency`

---

### DOMAIN 10: SOCIAL & GOVERNANCE SYSTEMS

#### Dataset 10.1 — UNDP Human Development Index (HDI)
- **URL**: `https://hdr.undp.org/data-center/documentation-and-downloads` (free CSV)
- **Format**: CSV direct download
- **Coverage**: 191 countries, 1990–2023
- **Variables**: HDI score, life expectancy index, education index, GNI per capita, gender inequality index, multidimensional poverty index
- **Graph Nodes Created**: `HDIScore`, `HumanDevelopmentLevel`, `GenderInequalityZone`
- **Key Relationships**:
  - Low HDI → `AMPLIFIES` → `DiseaseVulnerability`
  - Low HDI → `CORRELATES_WITH` → `HighFertilityRate`

#### Dataset 10.2 — V-Dem (Varieties of Democracy) Dataset
- **URL**: `https://www.v-dem.net/data/the-v-dem-dataset/` (free registration)
- **Format**: CSV, R, Stata
- **Coverage**: 202 countries, 1789–2023
- **Variables**: Liberal democracy index, electoral democracy, freedom of speech, media freedom, judicial independence, corruption index
- **Graph Nodes Created**: `DemocracyIndex`, `GovernanceIndicator`, `CorruptionLevel`

#### Dataset 10.3 — WHO/UNICEF Joint Monitoring Programme — Water & Sanitation
- **URL**: `https://washdata.org/data` (free download)
- **Format**: CSV, Excel
- **Coverage**: Global, 2000–2022
- **Variables**: Access to safe drinking water, basic sanitation, open defecation rates, hygiene facilities
- **Graph Nodes Created**: `WASHAccessZone`, `SanitationDeficitArea`
- **Key Relationships**:
  - Poor sanitation → `AMPLIFIES` → `DiarrhoealDiseaseRisk`
  - Open defecation → `CORRELATES_WITH` → `ChildStuntingRate`

---

## 4. Data Ingestion & ETL Pipeline

### Pipeline Architecture

```
[Raw Sources] → [Ingestion Layer] → [Transform Layer] → [Load Layer] → [Graph Builder]
     ↓                ↓                    ↓                  ↓               ↓
  APIs/CSVs      FastAPI workers       Pandas/Polars     Supabase PG       Neo4j AuraDB
  RSS Feeds      GitHub Actions        + GeoPandas       (raw metrics)     (relationships)
  NetCDF          (scheduled)          (geo transform)   + Supabase         (enriched)
  GeoTIFF                              + PyArrow          Storage
```

### ETL Worker Design (Python)

Each dataset has a dedicated Python module following this interface:

```python
# nexusgraph/etl/base.py
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List

@dataclass
class GraphNode:
    id: str               # unique: "climate_rainfall_IND_2023_W24"
    domain: str           # "climate", "disease", "economy", etc.
    entity_type: str      # "RainfallAnomaly", "DiseaseOutbreak"
    label: str            # Human-readable label
    properties: dict      # All raw attributes
    lat: float = None
    lon: float = None
    valid_from: str = None
    valid_to: str = None

@dataclass
class GraphEdge:
    source_id: str
    target_id: str
    relationship: str     # "DRIVES", "CORRELATES_WITH", "AMPLIFIES", etc.
    confidence: float     # 0.0 to 1.0
    lag_weeks: int = 0    # temporal lag
    source_dataset: str = ""
    evidence_type: str = "correlational"  # or "causal", "mechanistic"

class BaseIngester(ABC):
    @abstractmethod
    def fetch(self) -> List[dict]: ...
    
    @abstractmethod
    def transform(self, raw: List[dict]) -> List[GraphNode]: ...
    
    @abstractmethod
    def infer_edges(self, nodes: List[GraphNode]) -> List[GraphEdge]: ...
```

### Edge Inference Rules Engine

This is the core intelligence module. It runs after all nodes are loaded and applies a rule set to generate edges:

```python
# nexusgraph/etl/edge_rules.py

EDGE_RULES = [
    {
        "name": "rainfall_to_mosquito",
        "condition": lambda n1, n2: (
            n1.entity_type == "RainfallAnomaly" and 
            n2.entity_type == "MosquitoBreedingCondition" and
            n1.properties["anomaly_pct"] > 20 and
            geo_distance(n1, n2) < 200  # km
        ),
        "relationship": "DRIVES",
        "confidence": 0.75,
        "lag_weeks": 2
    },
    {
        "name": "crop_failure_to_migration",
        "condition": lambda n1, n2: (
            n1.entity_type == "CropYieldAnomaly" and 
            n2.entity_type == "InternalMigrantFlow" and
            n1.properties["yield_deficit_pct"] > 30
        ),
        "relationship": "TRIGGERS",
        "confidence": 0.68,
        "lag_weeks": 8
    },
    # ... 50+ rules
]
```

### GitHub Actions Scheduled Pipeline

```yaml
# .github/workflows/etl.yml
name: NexusGraph Daily ETL

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily
  workflow_dispatch:      # manual trigger

jobs:
  ingest:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        domain: [climate, disease, economy, agriculture, population, ecology, infrastructure]
    steps:
      - uses: actions/checkout@v4
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run domain ingester
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
          NEO4J_URI: ${{ secrets.NEO4J_URI }}
        run: python -m nexusgraph.etl.runner --domain ${{ matrix.domain }}
```

---

## 5. Database Schema & Graph Modeling

### Supabase PostgreSQL (Raw Metrics Store)

```sql
-- Core metrics table (time-series ready)
CREATE TABLE metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    domain VARCHAR(50) NOT NULL,          -- 'climate', 'disease', 'economy'
    entity_type VARCHAR(100) NOT NULL,    -- 'RainfallAnomaly', 'DengueOutbreak'
    entity_id VARCHAR(255) NOT NULL,      -- composite unique key
    country_code CHAR(3),                 -- ISO 3166-1 alpha-3
    admin1_code VARCHAR(10),             -- state/province code
    lat DECIMAL(10, 6),
    lon DECIMAL(10, 6),
    geom GEOMETRY(Point, 4326),          -- PostGIS point
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15, 4),
    unit VARCHAR(50),
    valid_from DATE NOT NULL,
    valid_to DATE,
    source_dataset VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_metrics_domain ON metrics(domain);
CREATE INDEX idx_metrics_entity ON metrics(entity_id);
CREATE INDEX idx_metrics_time ON metrics(valid_from, valid_to);
CREATE INDEX idx_metrics_geom ON metrics USING GIST(geom);
CREATE INDEX idx_metrics_country ON metrics(country_code);

-- Relationship metadata (mirrors Neo4j for REST queries)
CREATE TABLE relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_entity_id VARCHAR(255) NOT NULL,
    target_entity_id VARCHAR(255) NOT NULL,
    relationship_type VARCHAR(50) NOT NULL,
    confidence_score DECIMAL(3, 2),
    lag_weeks INTEGER DEFAULT 0,
    source_dataset VARCHAR(100),
    evidence_type VARCHAR(30),
    valid_from DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Geographic administrative boundaries
CREATE TABLE admin_boundaries (
    id SERIAL PRIMARY KEY,
    country_code CHAR(3),
    admin_level INTEGER,   -- 0=country, 1=state, 2=district
    admin_name VARCHAR(255),
    geom GEOMETRY(MultiPolygon, 4326),
    properties JSONB
);

-- Dataset registry (metadata about all ingested sources)
CREATE TABLE dataset_registry (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(50),
    source_url TEXT,
    update_frequency VARCHAR(20),
    last_ingested_at TIMESTAMPTZ,
    record_count INTEGER,
    is_active BOOLEAN DEFAULT TRUE
);

-- Alert events (for the real-time alert system)
CREATE TABLE alert_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type VARCHAR(50),
    severity VARCHAR(10),   -- 'low', 'medium', 'high', 'critical'
    title TEXT,
    description TEXT,
    affected_countries TEXT[],
    related_entity_ids TEXT[],
    fired_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ
);
```

### Neo4j AuraDB (Relationship Graph)

The graph schema uses Neo4j's property graph model:

```cypher
// Node labels and required properties
(:ClimateEvent {
    id: String,
    type: String,           // RainfallAnomaly, DroughtEvent, FloodEvent
    country: String,
    lat: Float,
    lon: Float,
    severity: Float,        // 0-10 scale
    anomaly_pct: Float,
    valid_from: Date,
    valid_to: Date
})

(:DiseaseEvent {
    id: String,
    type: String,           // DengueOutbreak, MalariaSpike, RespiratoryCrisis
    country: String,
    cases: Integer,
    mortality_rate: Float,
    lat: Float,
    lon: Float,
    valid_from: Date
})

(:EconomicIndicator {
    id: String,
    type: String,           // GDP_Growth, Unemployment, FoodPrice
    country: String,
    value: Float,
    unit: String,
    year: Integer
})

(:EcologicalEvent {
    id: String,
    type: String,           // DeforestationEvent, SpeciesDecline, FireAlert
    country: String,
    area_ha: Float,
    lat: Float,
    lon: Float,
    valid_from: Date
})

(:PopulationEvent {
    id: String,
    type: String,           // InternalMigration, RefugeeFlow, UrbanGrowth
    origin_country: String,
    destination_country: String,
    persons_affected: Integer,
    year: Integer
})

// Relationship types with properties
(:ClimateEvent)-[:DRIVES {
    confidence: Float,
    lag_weeks: Integer,
    mechanism: String,
    evidence_count: Integer
}]->(:DiseaseEvent)

(:ClimateEvent)-[:REDUCES {
    confidence: Float,
    lag_weeks: Integer
}]->(:EconomicIndicator)

(:EcologicalEvent)-[:AMPLIFIES {
    confidence: Float
}]->(:DiseaseEvent)

(:DiseaseEvent)-[:STRAINS {
    confidence: Float
}]->(:EconomicIndicator)

(:EconomicIndicator)-[:TRIGGERS {
    confidence: Float,
    lag_weeks: Integer
}]->(:PopulationEvent)

// Example Cypher queries
// "What does high rainfall drive?"
MATCH (c:ClimateEvent {type: 'RainfallAnomaly'})-[r:DRIVES]->(d)
WHERE r.confidence > 0.6
RETURN c, r, d ORDER BY r.confidence DESC

// "Show the full cascade from deforestation"
MATCH p = (e:EcologicalEvent {type: 'DeforestationEvent'})-[*1..4]->(end)
WHERE ALL(rel in relationships(p) WHERE rel.confidence > 0.5)
RETURN p LIMIT 50
```

---

## 6. Backend Architecture

### FastAPI Application Structure

```
backend/
├── main.py                    # FastAPI app entry
├── config.py                  # Settings (env vars)
├── requirements.txt
│
├── api/
│   ├── routes/
│   │   ├── graph.py           # Graph traversal endpoints
│   │   ├── metrics.py         # Time-series metrics
│   │   ├── map.py             # Geospatial/heatmap data
│   │   ├── intelligence.py    # AI briefing generation
│   │   ├── search.py          # Entity search
│   │   └── alerts.py          # Real-time alerts
│   └── dependencies.py        # DB connections, auth
│
├── etl/
│   ├── base.py               # BaseIngester abstract class
│   ├── runner.py             # ETL orchestrator
│   └── ingesters/
│       ├── climate/
│       │   ├── open_meteo.py
│       │   ├── imd_rainfall.py
│       │   └── flood_observatory.py
│       ├── disease/
│       │   ├── who_gho.py
│       │   ├── openaq.py
│       │   └── owid_covid.py
│       ├── economy/
│       │   ├── world_bank.py
│       │   └── fao_prices.py
│       ├── ecology/
│       │   ├── gbif.py
│       │   ├── global_forest_watch.py
│       │   └── nasa_firms.py
│       └── population/
│           ├── unhcr.py
│           └── worldpop.py
│
├── graph/
│   ├── neo4j_client.py       # Neo4j driver wrapper
│   ├── traversal.py          # Graph traversal algorithms
│   └── edge_rules.py         # Relationship inference rules
│
├── intelligence/
│   ├── briefing.py           # AI briefing generator
│   └── prompts.py            # LLM prompt templates
│
└── models/
    ├── graph.py              # Pydantic graph models
    └── metrics.py            # Pydantic metrics models
```

### Key API Endpoints

```
GET  /api/graph/node/{entity_id}          # Get node + all direct relationships
GET  /api/graph/expand/{entity_id}        # Expand 1-2 hops from node
GET  /api/graph/path?from={}&to={}        # Shortest path between two nodes
GET  /api/graph/cascade/{entity_type}     # Full cascade from a concept type

GET  /api/metrics/timeseries             # Time-series for a metric
     ?entity_type=RainfallAnomaly&country=IND&from=2015-01&to=2024-12

GET  /api/map/heatmap                    # Heatmap data layer
     ?layer=disease_dengue&bbox=..&date=2023-01

GET  /api/map/layers                     # List all available map layers
GET  /api/map/overlay?layers=[]          # Multi-layer overlay data

POST /api/intelligence/briefing          # Generate AI briefing for a node/relationship
     {entity_id: "...", context_nodes: [...]}

GET  /api/search?q={term}&domain={}      # Full-text entity search
GET  /api/alerts/active                  # Current high-severity alerts
GET  /api/graph/concepts                 # All top-level explorable concepts
GET  /api/datasets/registry             # All ingested datasets metadata
```

### Caching Strategy

```python
# Upstash Redis caching for expensive graph queries
@app.get("/api/graph/cascade/{entity_type}")
async def get_cascade(entity_type: str):
    cache_key = f"cascade:{entity_type}"
    
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)
    
    result = await graph_client.run_cascade_query(entity_type)
    
    # Cache for 6 hours (graph data doesn't change rapidly)
    await redis.setex(cache_key, 21600, json.dumps(result))
    return result
```

---

## 7. Frontend Architecture & UI Components

### React Application Structure

```
frontend/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   │
│   ├── pages/
│   │   ├── Home.tsx             # Main graph explorer
│   │   ├── MapView.tsx          # Global intelligence map
│   │   ├── Timeline.tsx         # Time simulation view
│   │   ├── Briefing.tsx         # AI intelligence briefing panel
│   │   └── DataRegistry.tsx     # Dataset browser
│   │
│   ├── components/
│   │   ├── graph/
│   │   │   ├── GraphCanvas.tsx      # Cytoscape.js wrapper
│   │   │   ├── NodePanel.tsx        # Node detail sidebar
│   │   │   ├── EdgePanel.tsx        # Relationship detail
│   │   │   ├── ConceptSearch.tsx    # Search to start graph
│   │   │   └── GraphControls.tsx    # Zoom, filter, layout
│   │   │
│   │   ├── map/
│   │   │   ├── IntelligenceMap.tsx  # Leaflet main map
│   │   │   ├── HeatmapLayer.tsx     # Leaflet.heat layer
│   │   │   ├── ClusterLayer.tsx     # Marker clustering
│   │   │   ├── LayerSelector.tsx    # Layer toggle panel
│   │   │   └── MapPopup.tsx         # Click popup with mini-graph
│   │   │
│   │   ├── charts/
│   │   │   ├── TimeSeriesChart.tsx  # Recharts line/area chart
│   │   │   ├── CorrelationMatrix.tsx # D3 correlation heatmap
│   │   │   ├── DomainRadar.tsx      # D3 radar/spider chart
│   │   │   └── RiskGauge.tsx        # SVG gauge component
│   │   │
│   │   ├── timeline/
│   │   │   ├── TimelineSlider.tsx   # Year/month range slider
│   │   │   ├── EventStream.tsx      # Chronological events list
│   │   │   └── CascadeAnimation.tsx # Animated cascade playback
│   │   │
│   │   └── ui/                      # shadcn/ui + custom
│   │       ├── AlertBanner.tsx
│   │       ├── ConfidenceBadge.tsx
│   │       ├── DomainBadge.tsx
│   │       └── IntelligenceBriefing.tsx
│   │
│   ├── hooks/
│   │   ├── useGraph.ts           # Graph data + expansion logic
│   │   ├── useMapLayers.ts       # Map layer state management
│   │   ├── useTimeline.ts        # Timeline state
│   │   └── useIntelligence.ts    # AI briefing fetcher
│   │
│   ├── store/
│   │   └── graphStore.ts         # Zustand global state
│   │
│   └── lib/
│       ├── api.ts                # API client (TanStack Query)
│       ├── cytoscapeConfig.ts    # Cytoscape styles + layouts
│       └── leafletConfig.ts      # Leaflet map configuration
```

### Graph Visualization: Cytoscape.js Configuration

```typescript
// cytoscapeConfig.ts
export const cytoscapeStyles = [
  {
    selector: 'node',
    style: {
      'background-color': 'data(color)',
      'border-width': 2,
      'border-color': '#1a1a2e',
      'label': 'data(label)',
      'color': '#e0e0ff',
      'font-size': '11px',
      'font-family': 'JetBrains Mono, monospace',
      'text-valign': 'bottom',
      'text-margin-y': 5,
      'width': 'data(size)',
      'height': 'data(size)',
    }
  },
  {
    selector: 'node[domain="climate"]',
    style: { 'background-color': '#00b4d8', 'shape': 'hexagon' }
  },
  {
    selector: 'node[domain="disease"]',
    style: { 'background-color': '#ef233c', 'shape': 'diamond' }
  },
  {
    selector: 'node[domain="economy"]',
    style: { 'background-color': '#f4a261', 'shape': 'rectangle' }
  },
  {
    selector: 'node[domain="ecology"]',
    style: { 'background-color': '#52b788', 'shape': 'pentagon' }
  },
  {
    selector: 'node[domain="population"]',
    style: { 'background-color': '#a8dadc', 'shape': 'ellipse' }
  },
  {
    selector: 'edge',
    style: {
      'width': 'data(weight)',
      'line-color': 'data(edgeColor)',
      'target-arrow-color': 'data(edgeColor)',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'label': 'data(relationship)',
      'font-size': '9px',
      'color': '#888',
      'opacity': 0.8
    }
  },
  {
    selector: 'edge[confidence < 0.5]',
    style: { 'line-style': 'dashed', 'opacity': 0.4 }
  },
  {
    selector: ':selected',
    style: {
      'border-width': 4,
      'border-color': '#f0f0ff',
      'background-color': '#ffffff'
    }
  }
];

export const cytoscapeLayouts = {
  default: {
    name: 'cose-bilkent',
    animate: true,
    animationDuration: 600,
    nodeRepulsion: 8000,
    idealEdgeLength: 180,
    gravity: 0.25,
    numIter: 2500,
  },
  hierarchical: {
    name: 'dagre',
    rankDir: 'TB',
    nodeSep: 80,
    rankSep: 120,
    animate: true
  },
  radial: {
    name: 'concentric',
    concentric: (node: any) => node.degree(),
    levelWidth: () => 2,
    animate: true
  }
};
```

### Map Configuration: Leaflet + Heatmap

```typescript
// leafletConfig.ts
export const MAP_LAYERS = {
  disease_dengue: {
    label: 'Dengue Risk',
    color: '#ef233c',
    domain: 'disease',
    endpoint: '/api/map/heatmap?layer=disease_dengue'
  },
  climate_rainfall: {
    label: 'Rainfall Anomaly',
    color: '#00b4d8',
    domain: 'climate',
    endpoint: '/api/map/heatmap?layer=climate_rainfall'
  },
  ecology_deforestation: {
    label: 'Deforestation',
    color: '#52b788',
    domain: 'ecology',
    endpoint: '/api/map/heatmap?layer=ecology_deforestation'
  },
  economy_food_price: {
    label: 'Food Price Stress',
    color: '#f4a261',
    domain: 'economy',
    endpoint: '/api/map/heatmap?layer=economy_food_price'
  },
  population_displacement: {
    label: 'Displacement Events',
    color: '#a8dadc',
    domain: 'population',
    endpoint: '/api/map/heatmap?layer=population_displacement'
  },
  infrastructure_conflict: {
    label: 'Conflict Events',
    color: '#c77dff',
    domain: 'infrastructure',
    endpoint: '/api/map/heatmap?layer=infrastructure_conflict'
  },
  ecology_wildfire: {
    label: 'Active Wildfires',
    color: '#ff6b35',
    domain: 'ecology',
    endpoint: '/api/map/heatmap?layer=ecology_wildfire'
  }
};

export const TILE_PROVIDERS = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  terrain: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png'
};
```

---

## 8. Graph Relationship Engine

### The Relationship Taxonomy

All edges in NexusGraph follow a controlled vocabulary of relationship types. This prevents the "over-connection noise" risk and keeps the graph semantically meaningful.

| Relationship Type | Direction | Strength | Example |
|-------------------|-----------|----------|---------|
| `DRIVES` | Direct causal mechanism | Strong | Rainfall → Mosquito breeding |
| `AMPLIFIES` | Makes existing effect worse | Strong | Poor sanitation → Amplifies disease risk |
| `REDUCES` | Diminishes capacity or quantity | Strong | Drought → Reduces hydropower |
| `TRIGGERS` | Acts as a tipping point | Strong | Crop failure → Triggers migration |
| `CORRELATES_WITH` | Statistical association | Medium | GDP growth ↔ Life expectancy |
| `PRECEDES` | Temporal precedence with lag | Medium | Rainfall → (2 weeks lag) → Dengue |
| `STRESSES` | Increases load on system | Medium | Disease → Stresses healthcare |
| `SIGNALS` | Early warning indicator | Medium | NDVI decline → Signals crop stress |
| `COLLAPSES` | Causes system failure | Strong | Conflict + Disease → Collapses healthcare |
| `MITIGATES` | Reduces impact or severity | Medium | Hospital density → Mitigates disease mortality |
| `SHIFTS` | Changes distribution or location | Weak-Medium | Climate change → Shifts species range |

### Confidence Scoring Methodology

Every edge confidence score is calculated from a weighted formula:

```python
def calculate_confidence(
    correlation_r: float,      # Pearson correlation from historical data
    evidence_count: int,       # Number of supporting studies/instances
    mechanism_known: bool,     # Is biological/physical mechanism understood?
    temporal_consistency: float,  # How consistent is the lag across instances?
    sample_size: int           # Data points used for correlation
) -> float:
    
    base = abs(correlation_r)  # 0.0 to 1.0
    
    # Evidence multiplier
    evidence_boost = min(0.2, evidence_count * 0.02)
    
    # Mechanism bonus (known mechanism = more confidence)
    mechanism_bonus = 0.15 if mechanism_known else 0.0
    
    # Temporal consistency
    temporal_factor = temporal_consistency * 0.1
    
    # Sample size correction (Fisher's z-transformation for small n)
    if sample_size < 30:
        base *= (sample_size / 30) ** 0.5
    
    confidence = base + evidence_boost + mechanism_bonus + temporal_factor
    return round(min(0.95, max(0.05, confidence)), 2)
```

### Graph Traversal Algorithms

```python
# graph/traversal.py

async def expand_node(entity_id: str, max_hops: int = 2, min_confidence: float = 0.5):
    """Expand from a node up to N hops, filtered by confidence"""
    query = """
    MATCH (start {id: $entity_id})
    CALL apoc.path.expand(start, null, null, 1, $max_hops) YIELD path
    WHERE ALL(rel IN relationships(path) WHERE rel.confidence >= $min_confidence)
    RETURN path
    LIMIT 150
    """
    return await neo4j_client.run(query, entity_id=entity_id, 
                                   max_hops=max_hops, min_confidence=min_confidence)

async def find_cascade_paths(source_type: str, target_domain: str):
    """Find all multi-hop paths from a source type to a target domain"""
    query = """
    MATCH p = (source)-[*2..5]->(target)
    WHERE source.type = $source_type
    AND target.domain = $target_domain
    AND ALL(r IN relationships(p) WHERE r.confidence > 0.4)
    WITH p, 
         REDUCE(conf = 1.0, r IN relationships(p) | conf * r.confidence) AS path_confidence
    WHERE path_confidence > 0.1
    RETURN p, path_confidence
    ORDER BY path_confidence DESC
    LIMIT 20
    """
    return await neo4j_client.run(query, source_type=source_type, target_domain=target_domain)
```

---

## 9. AI Intelligence Briefing System

### Briefing Generation Pipeline

When a user selects a node or relationship, the system:

1. Fetches the node's properties + its top 5 related nodes from Neo4j
2. Fetches the last 12 months of metrics for the entity from Supabase
3. Constructs a structured context prompt
4. Calls the Groq API (LLaMA 3.3 70B — free 14,400 req/day)
5. Returns a structured intelligence briefing

### LLM Prompt Engineering

```python
BRIEFING_SYSTEM_PROMPT = """
You are an intelligence analyst for a multi-domain risk platform. You produce structured,
evidence-based intelligence briefings in the style of professional geopolitical/epidemiological 
analysis. You speak with precision. You acknowledge uncertainty. You use confidence levels.
You NEVER speculate beyond the data provided. Output as JSON following the schema exactly.
"""

def build_briefing_prompt(node: GraphNode, related: List[GraphNode], 
                           metrics: List[dict], edges: List[GraphEdge]) -> str:
    return f"""
Produce an intelligence briefing for the following observed system state.

PRIMARY ENTITY:
- Type: {node.entity_type}
- Domain: {node.domain}
- Location: {node.properties.get('country', 'Global')}
- Key Value: {node.properties.get('metric_value', 'N/A')} {node.properties.get('unit', '')}
- Time Period: {node.valid_from} to {node.valid_to or 'ongoing'}
- Severity: {node.properties.get('severity', 'unknown')} / 10

RECENT TREND (last 12 months of data):
{json.dumps(metrics[-12:], indent=2)}

CONNECTED ENTITIES ({len(related)} nodes within 2 hops):
{chr(10).join([f"- [{e.relationship}] → {n.entity_type} in {n.properties.get('country', '')} (confidence: {e.confidence})" 
               for n, e in zip(related, edges)])}

OUTPUT JSON FORMAT:
{{
    "headline": "One-line intelligence headline",
    "classification": "UNCLASSIFIED // FOR DEMONSTRATION",
    "situation_summary": "2-3 sentence current situation",
    "contributing_factors": ["factor 1", "factor 2", "factor 3"],
    "downstream_risks": [
        {{"risk": "...", "domain": "...", "probability": "HIGH/MEDIUM/LOW", "timeframe": "weeks/months"}}
    ],
    "confidence_assessment": "HIGH/MEDIUM/LOW with reason",
    "data_gaps": ["gap 1", "gap 2"],
    "recommended_monitoring": ["monitor 1", "monitor 2"]
}}
"""
```

---

## 10. Maps, Heatmaps & Geospatial Layer

### Heatmap Data API

The `/api/map/heatmap` endpoint returns arrays of `[lat, lon, intensity]` tuples optimized for Leaflet.heat. Intensity is normalized 0–1 based on the domain's severity scale.

```python
@app.get("/api/map/heatmap")
async def get_heatmap(
    layer: str,
    date: str = None,
    bbox: str = None,        # "minLon,minLat,maxLon,maxLat"
    resolution: int = 1      # grid cell size in degrees
):
    # Query Supabase with PostGIS spatial filtering
    query = """
    SELECT 
        ST_Y(geom::geometry) as lat,
        ST_X(geom::geometry) as lon,
        (metric_value - min_val) / (max_val - min_val) as intensity
    FROM metrics
    CROSS JOIN (
        SELECT MIN(metric_value) as min_val, MAX(metric_value) as max_val
        FROM metrics WHERE entity_type = $1
    ) stats
    WHERE entity_type = $1
    AND valid_from <= $2 AND (valid_to IS NULL OR valid_to >= $2)
    AND geom IS NOT NULL
    AND ST_Within(geom::geometry, ST_MakeEnvelope($3, $4, $5, $6, 4326))
    """
    rows = await supabase.execute(query, [layer, date, ...bbox])
    return {"points": [[r.lat, r.lon, r.intensity] for r in rows]}
```

### Multi-Layer Overlay System

The map supports simultaneous rendering of multiple heatmap layers with adjustable opacity and blend modes. Users can enable up to 4 layers at once and see where they spatially overlap — the visual "hotspot" where three domains converge (high rainfall + dengue + low hospital access) is where NexusGraph's visual intelligence shines.

### Interactive Region Click → Graph Launch

When a user clicks any region on the map, the system:
1. Performs a spatial query to find all entities within ~50km radius
2. Automatically constructs a mini-graph centered on that location
3. Opens the graph panel pre-populated with that location's nodes
4. Generates an intelligence briefing for the regional situation

---

## 11. Real-Time & Timeline Systems

### Timeline Architecture

The timeline slider uses Supabase's `valid_from`/`valid_to` system. A global `currentDate` state in Zustand drives all graph queries and map rendering. When the user moves the slider:

1. `currentDate` updates in Zustand
2. React Query invalidates all cached graph/map queries
3. API calls include `?as_of={date}` parameter
4. Both Neo4j and Supabase filter to that temporal snapshot
5. The graph re-renders with the historical state

### Alert System

Active alerts are generated by a background job that:
- Runs every 6 hours via GitHub Actions
- Checks for threshold breaches (e.g., dengue cases spike >200% month-over-month)
- Cross-references against related nodes (is there a rainfall anomaly nearby? Low hospital density?)
- Generates an alert with severity scoring
- Stores in the `alert_events` table
- Frontend polls `/api/alerts/active` every 5 minutes

```python
ALERT_RULES = [
    {
        "name": "dengue_rainfall_combo",
        "condition": """
            RainfallAnomaly.anomaly_pct > 40 
            AND WITHIN(RainfallAnomaly, DengueOutbreak, 300km)
            AND DengueOutbreak.cases_growth_pct > 150
        """,
        "severity": "HIGH",
        "title": "High dengue risk from rainfall anomaly in {region}"
    },
    {
        "name": "food_conflict_crisis",
        "condition": """
            FoodPriceIndex.change_pct > 30
            AND ConflictEvent.fatalities > 50 WITHIN SAME COUNTRY
            AND HDIScore.value < 0.55
        """,
        "severity": "CRITICAL",
        "title": "Compounding food-conflict humanitarian crisis in {country}"
    }
]
```

---

## 12. Deployment Architecture (Free Tier)

### Infrastructure Diagram

```
User Browser
     │
     ▼
[Vercel CDN]         ← React frontend (free: 100GB/month)
     │
     ▼
[Railway.app]        ← FastAPI backend (free: $5 credit/month)
     │
     ├──────────────────────────────┐
     ▼                              ▼
[Supabase]                    [Neo4j AuraDB]
PostgreSQL + PostGIS           Graph Database
(free: 500MB)                  (free: 200MB)
     │
     ▼
[Upstash Redis]       ← Query cache (free: 10k cmd/day)
     │
     ▼
[GitHub Actions]      ← ETL scheduler (free: 2000 min/month)
     │
     ▼
[Groq API]            ← LLM briefings (free: 14400 req/day)
```

### Environment Variables

```env
# .env.production
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx

NEO4J_URI=neo4j+s://xxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=xxx

UPSTASH_REDIS_URL=https://xxx.upstash.io
UPSTASH_REDIS_TOKEN=xxx

GROQ_API_KEY=gsk_xxx

# Dataset API keys
DATA_GOV_IN_API_KEY=xxx
OPENAQ_API_KEY=xxx
NASA_EARTHDATA_TOKEN=xxx
IUCN_API_TOKEN=xxx
ACLED_API_KEY=xxx

VITE_API_BASE_URL=https://nexusgraph-api.railway.app
```

---

## 13. Development Phases & Timeline

### Phase 1 — Foundation (Weeks 1–3)

**Goal**: Working data pipeline and graph schema

- Set up Supabase project, create all tables with PostGIS
- Set up Neo4j AuraDB free instance
- Implement base ETL classes and runner
- Ingest 5 core datasets: Open-Meteo, WHO GHO, World Bank, FAOSTAT, UNHCR
- Write edge inference rules for 15 cross-domain relationships
- FastAPI with basic `/graph/node/{id}` and `/metrics/timeseries` endpoints
- Verify 10,000+ nodes and 5,000+ edges loaded in Neo4j

### Phase 2 — Core UI (Weeks 4–6)

**Goal**: Interactive graph explorer working end-to-end

- React + Vite project setup with Tailwind + shadcn/ui
- Cytoscape.js graph canvas with node styling by domain
- Node expansion on click (1-hop then 2-hop)
- Intelligence briefing sidebar using Groq API
- Concept search bar (type "rainfall" → expands rainfall nodes)
- Confidence badge and relationship type labels on edges
- Deploy frontend to Vercel, backend to Railway

### Phase 3 — Maps & Heatmaps (Weeks 7–9)

**Goal**: Fully functional geospatial intelligence layer

- Leaflet.js map with dark CARTO tiles
- Implement heatmap layers for: disease, climate, ecology, conflict, displacement
- Multi-layer toggle panel with opacity controls
- Click-on-region → launch graph for that location
- Admin boundary overlays (country + state level)
- Ingest 10 more datasets: OpenAQ, GBIF, Global Forest Watch, FIRMS, ACLED, etc.
- Spatial query optimization in Supabase with PostGIS indexes

### Phase 4 — Timeline & Intelligence (Weeks 10–12)

**Goal**: Time simulation and full AI briefing system

- Timeline slider component with Zustand global date state
- Historical graph snapshots (query Neo4j and Supabase at any past date)
- Cascade animation: watch a rainfall event → drive dengue → stress economy
- Full AI briefing system with Groq LLaMA 3.3 70B
- Alert system with GitHub Actions scheduler
- Domain radar chart and correlation matrix visualizations
- Ingest remaining 15 datasets to reach 30+ total

### Phase 5 — Polish & Portfolio (Weeks 13–14)

**Goal**: Production-quality demo ready for portfolio showcase

- Performance optimization: virtualize large graph renders
- Add loading skeletons and smooth animations for all transitions
- Create 5 curated "intelligence scenarios" as guided demos:
  1. Indian Monsoon Failure → Food Prices → Migration
  2. Amazon Deforestation → Disease Risk → Healthcare Stress
  3. Ukraine Conflict → Global Food Price → Developing World Hunger
  4. Air Pollution + Urbanization → Respiratory Disease Cascade
  5. El Niño → Drought → Conflict → Displacement Chain
- README and project documentation
- Sentry error tracking integration
- Grafana Cloud dashboard for API metrics

---

## 14. Data Flow Diagrams

### End-to-End Data Flow

```
1. INGESTION
   GitHub Actions (cron 2AM) 
   → fetch from 30+ APIs
   → raw JSON/CSV in Supabase Storage (1GB free)

2. TRANSFORM
   Pandas/Polars pipeline
   → normalize to unified metrics schema
   → geoparse to lat/lon
   → compute anomaly scores

3. LOAD
   → Supabase PostgreSQL (metrics, timeseries, admin boundaries)
   → Neo4j AuraDB (graph nodes)

4. EDGE INFERENCE
   → Python rule engine
   → calculate confidence scores
   → lag-based temporal linking
   → write edges to Neo4j

5. API LAYER
   FastAPI + Upstash Redis cache
   → serve graph traversal
   → serve heatmap tile data
   → proxy LLM briefing requests

6. FRONTEND
   React + Cytoscape.js + Leaflet
   → render intelligence graph
   → render multi-layer heatmaps
   → display AI briefings
   → timeline playback
```

### User Interaction Flow

```
User types "dengue"
     │
     ▼
Search API → find DengueOutbreak nodes in Neo4j
     │
     ▼
Load top 3 dengue nodes + direct relationships (1-hop)
     │
     ▼
Render graph: DengueOutbreak ← [DRIVES] ← RainfallAnomaly
              DengueOutbreak → [STRESSES] → HealthcareSystem
              DengueOutbreak → [REDUCES] → EconomicProductivity
     │
User clicks "Rainfall Anomaly" node
     │
     ▼
Expand 1 more hop: add MosquitoBreeding, FloodEvent, CropStress
     │
User clicks "Generate Briefing"
     │
     ▼
Fetch node context → build LLM prompt → Groq API
     │
     ▼
Display structured intelligence briefing in sidebar
     │
User opens Map view for this node
     │
     ▼
Heatmap: show rainfall anomaly layer + dengue layer overlaid
     │
User drags timeline to 2021
     │
     ▼
All queries re-run with as_of=2021-06-01
Graph and map update to show 2021 state
```

---

## 15. Portfolio Showcase Checklist

This is what you can demonstrate to interviewers and in your README:

### Data Engineering Skills
- [x] 30+ heterogeneous public datasets ingested and unified (APIs, CSV, NetCDF, GeoTIFF)
- [x] Custom ETL pipeline with abstract base class and domain-specific ingesters
- [x] Temporal data modeling with valid_from/valid_to snapshot architecture
- [x] Automated scheduling via GitHub Actions cron workflows
- [x] PostGIS spatial indexing and geo queries (bounding box, radius, ST_Within)
- [x] Property graph modeling in Neo4j with typed relationships and confidence scores
- [x] Dual-database architecture (PostgreSQL for metrics, Neo4j for relationships)
- [x] Redis caching layer for expensive graph queries

### Data Science / Analytics Skills
- [x] Cross-domain correlation analysis with statistically-derived confidence scores
- [x] Temporal lag modeling (rainfall → dengue 2-week lag)
- [x] Anomaly detection on time-series (percent deviation from baseline)
- [x] Evidence-based edge inference rule engine (50+ rules)
- [x] NDVI analysis integration (satellite vegetation health)
- [x] Spatial clustering and density analysis

### Backend Engineering Skills
- [x] FastAPI async REST API with Pydantic validation
- [x] Graph traversal algorithms (BFS, shortest path, cascade expansion)
- [x] LLM integration with structured JSON output (Groq + LLaMA 3.3 70B)
- [x] Alert rule engine with threshold monitoring
- [x] Geospatial API with heatmap tile generation
- [x] Background job architecture (GitHub Actions + Celery)

### Frontend Engineering Skills
- [x] Interactive graph visualization (Cytoscape.js with custom styling per domain)
- [x] Multi-layer geospatial heatmaps (Leaflet.js + Leaflet.heat)
- [x] Real-time data with TanStack Query (polling, cache invalidation)
- [x] Complex state management (Zustand with time-travel simulation)
- [x] D3.js correlation matrix and radar chart components
- [x] Responsive dark intelligence-style UI (Tailwind + shadcn/ui)

### System Design Skills
- [x] Multi-domain data integration architecture
- [x] Graph database schema design (Neo4j property graph)
- [x] Confidence and provenance tracking at edge level
- [x] Free-tier full-stack deployment (Vercel + Railway + Supabase + Neo4j AuraDB)
- [x] Scalable ingestion via domain-isolated GitHub Actions matrix jobs

---

## Appendix A: Dataset Quick Reference Table

| # | Dataset | Domain | Source | Format | API/Download | Update |
|---|---------|--------|--------|--------|--------------|--------|
| 1 | Open-Meteo Historical | Climate | Open-Meteo | JSON REST | API (no key) | Daily |
| 2 | NOAA GSOD | Climate | NOAA | CSV | API (free key) | Daily |
| 3 | IMD Gridded Rainfall | Climate | IMD | NetCDF | Download | Daily |
| 4 | ERA5 Reanalysis | Climate | Copernicus | NetCDF | API (free reg) | Monthly |
| 5 | Global Flood Database | Climate | Cloud to Street | CSV/SHP | Download | Annual |
| 6 | WHO GHO | Disease | WHO | OData JSON | API (no key) | Annual |
| 7 | IDSP India | Disease | MoHFW/data.gov.in | JSON | API (free key) | Weekly |
| 8 | OWID COVID-19 | Disease | Our World in Data | CSV | Direct URL | Daily |
| 9 | ProMED Alerts | Disease | ISID | RSS/XML | Feed (no key) | Realtime |
| 10 | OpenAQ | Disease/Climate | OpenAQ | JSON | API (free key) | Hourly |
| 11 | World Bank Open Data | Economy | World Bank | JSON | API (no key) | Annual |
| 12 | FAO Food Price Index | Economy | FAO | CSV/JSON | API/Download | Monthly |
| 13 | IMF WEO | Economy | IMF | CSV | Download | Biannual |
| 14 | MoSPI India | Economy | MoSPI | JSON | API (free key) | Monthly |
| 15 | UN COMTRADE | Economy | UN | JSON | API (free key) | Monthly |
| 16 | FAOSTAT Crops | Agriculture | FAO | JSON | API (no key) | Annual |
| 17 | NASA MODIS NDVI | Agriculture | NASA | GeoTIFF | API (free reg) | 16-day |
| 18 | USDA NASS | Agriculture | USDA | JSON | API (free key) | Weekly |
| 19 | JRC MARS Agro | Agriculture | JRC | CSV/GIS | Download | Monthly |
| 20 | UN World Population | Population | UNDESA | JSON | API (no key) | Annual |
| 21 | UNHCR Displacement | Population | UNHCR | JSON | API (no key) | Annual |
| 22 | India Census | Population | Registrar General | CSV | data.gov.in | Decadal |
| 23 | WorldPop Gridded | Population | Univ. Southampton | GeoTIFF | Download | Annual |
| 24 | GBIF Biodiversity | Ecology | GBIF | JSON | API (no key) | Realtime |
| 25 | IUCN Red List | Ecology | IUCN | JSON | API (free key) | Annual |
| 26 | Global Forest Watch | Ecology | WRI | GeoTIFF/CSV | API/Download | Annual |
| 27 | Copernicus Land Cover | Ecology | Copernicus | NetCDF | API (free reg) | Annual |
| 28 | NASA FIRMS Fires | Ecology | NASA | CSV | API (free key) | Realtime |
| 29 | OSM via Overpass | Infrastructure | OSM | JSON | API (no key) | Realtime |
| 30 | Global Power Plants | Infrastructure | WRI | CSV | Download | Annual |
| 31 | ACLED Conflict | Infrastructure | ACLED | CSV/JSON | API (free reg) | Weekly |
| 32 | HDX Humanitarian | Infrastructure | OCHA | CSV | API (no key) | Variable |
| 33 | IGRAC Groundwater | Water | UN-IGRAC | CSV/SHP | Download | Annual |
| 34 | JRC Surface Water | Water | JRC | GeoTIFF | GEE/Download | Annual |
| 35 | Copernicus Marine | Water | CMEMS | NetCDF | API (free reg) | Daily |
| 36 | Global Carbon Project | Energy | GCP/OWID | CSV | Direct URL | Annual |
| 37 | UNDP HDI | Social | UNDP | CSV | Download | Annual |
| 38 | V-Dem Democracy | Social | V-Dem | CSV | Download | Annual |
| 39 | WHO/UNICEF WASH | Social | JMP | CSV | Download | Annual |

---

## Appendix B: Key Python Dependencies

```txt
# requirements.txt
fastapi==0.115.0
uvicorn[standard]==0.30.0
python-dotenv==1.0.0
httpx==0.27.0            # async HTTP for API calls
pandas==2.2.0
polars==0.20.0           # fast ETL for large CSV files
geopandas==0.14.0        # geospatial transforms
pyarrow==16.0.0          # columnar data processing
netCDF4==1.7.0           # ERA5, IMD, Copernicus NetCDF files
rasterio==1.3.0          # GeoTIFF processing (NDVI, WorldPop)
shapely==2.0.0           # geometry operations
supabase==2.5.0          # Supabase Python client
neo4j==5.20.0            # Neo4j async Python driver
redis==5.0.0             # Upstash Redis client
celery==5.4.0            # background jobs
pydantic==2.7.0          # data validation
pydantic-settings==2.3.0
groq==0.9.0              # Groq API client
scipy==1.13.0            # correlation calculations
scikit-learn==1.5.0      # normalization, clustering
apscheduler==3.10.0      # in-process scheduler
loguru==0.7.0            # structured logging
sentry-sdk[fastapi]==2.5.0
```

---

*NexusGraph Implementation Plan — Version 1.0*
*Generated for portfolio development and technical showcase purposes.*
*All datasets referenced are publicly available under open licenses.*
