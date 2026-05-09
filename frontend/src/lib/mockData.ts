export type Domain = string

export type GraphNode = {
  id: string
  label: string
  domain: Domain
  entityType: string
  severity: number
  validFrom: string
  validTo?: string
  source: string
  lat?: number
  lon?: number
  properties?: Record<string, string | number>
}

export type GraphEdge = {
  id: string
  source: string
  target: string
  relationship: string
  confidence: number
  lagWeeks: number
  sourceDataset: string
  evidenceType: string
}

export const graphNodes: GraphNode[] = [
  {
    id: 'climate_rainfall_kerala_2024_w24',
    label: 'Rainfall Anomaly - Kerala',
    domain: 'climate',
    entityType: 'RainfallAnomaly',
    severity: 7.2,
    validFrom: '2024-06-01',
    validTo: '2024-08-30',
    source: 'Open-Meteo',
    lat: 10.1632,
    lon: 76.6413,
    properties: { anomaly_pct: 38 },
  },
  {
    id: 'health_mosquito_kerala_2024_w26',
    label: 'Mosquito Breeding Surge',
    domain: 'disease',
    entityType: 'MosquitoBreedingCondition',
    severity: 6.1,
    validFrom: '2024-06-15',
    validTo: '2024-08-15',
    source: 'IDSP',
    lat: 10.0,
    lon: 76.3,
    properties: { breeding_index: 0.78 },
  },
  {
    id: 'disease_dengue_chennai_2024_w28',
    label: 'Dengue Outbreak - Chennai',
    domain: 'disease',
    entityType: 'DengueOutbreak',
    severity: 7.9,
    validFrom: '2024-07-01',
    validTo: '2024-09-15',
    source: 'IDSP',
    lat: 13.0827,
    lon: 80.2707,
    properties: { cases: 1240 },
  },
  {
    id: 'health_system_tn_2024',
    label: 'Healthcare System Stress - TN',
    domain: 'infrastructure',
    entityType: 'HealthSystemStress',
    severity: 6.4,
    validFrom: '2024-07-10',
    source: 'WHO GHO',
    lat: 11.1271,
    lon: 78.6569,
  },
  {
    id: 'economy_food_price_punjab_2024',
    label: 'Food Price Stress - Punjab',
    domain: 'economy',
    entityType: 'FoodPriceEvent',
    severity: 6.8,
    validFrom: '2024-06-01',
    source: 'FAO',
    lat: 31.1471,
    lon: 75.3412,
    properties: { price_index_change: 18 },
  },
  {
    id: 'population_migration_bihar_2024',
    label: 'Internal Migration - Bihar',
    domain: 'population',
    entityType: 'InternalMigrantFlow',
    severity: 5.9,
    validFrom: '2024-06-15',
    source: 'UNHCR',
    lat: 25.0961,
    lon: 85.3131,
    properties: { persons_affected: 32000 },
  },
  {
    id: 'ecology_deforestation_amazon_2024',
    label: 'Deforestation Spike - Amazon',
    domain: 'ecology',
    entityType: 'DeforestationEvent',
    severity: 8.1,
    validFrom: '2024-05-01',
    source: 'Global Forest Watch',
    lat: -3.4653,
    lon: -62.2159,
    properties: { area_ha: 18200 },
  },
  {
    id: 'disease_zoonotic_risk_amazon_2024',
    label: 'Zoonotic Spillover Risk',
    domain: 'disease',
    entityType: 'ZoonoticDiseaseRisk',
    severity: 6.7,
    validFrom: '2024-05-15',
    source: 'GBIF',
    lat: -3.2,
    lon: -61.9,
  },
]

export const graphEdges: GraphEdge[] = [
  {
    id: 'edge_rainfall_mosquito',
    source: 'climate_rainfall_kerala_2024_w24',
    target: 'health_mosquito_kerala_2024_w26',
    relationship: 'DRIVES',
    confidence: 0.75,
    lagWeeks: 2,
    sourceDataset: 'Open-Meteo + IDSP',
    evidenceType: 'correlational',
  },
  {
    id: 'edge_mosquito_dengue',
    source: 'health_mosquito_kerala_2024_w26',
    target: 'disease_dengue_chennai_2024_w28',
    relationship: 'AMPLIFIES',
    confidence: 0.68,
    lagWeeks: 2,
    sourceDataset: 'IDSP',
    evidenceType: 'correlational',
  },
  {
    id: 'edge_dengue_healthsystem',
    source: 'disease_dengue_chennai_2024_w28',
    target: 'health_system_tn_2024',
    relationship: 'STRESSES',
    confidence: 0.62,
    lagWeeks: 0,
    sourceDataset: 'WHO GHO',
    evidenceType: 'correlational',
  },
  {
    id: 'edge_foodprice_migration',
    source: 'economy_food_price_punjab_2024',
    target: 'population_migration_bihar_2024',
    relationship: 'TRIGGERS',
    confidence: 0.58,
    lagWeeks: 8,
    sourceDataset: 'FAO + UNHCR',
    evidenceType: 'correlational',
  },
  {
    id: 'edge_deforestation_zoonotic',
    source: 'ecology_deforestation_amazon_2024',
    target: 'disease_zoonotic_risk_amazon_2024',
    relationship: 'AMPLIFIES',
    confidence: 0.66,
    lagWeeks: 4,
    sourceDataset: 'Global Forest Watch + GBIF',
    evidenceType: 'mechanistic',
  },
]

export const domainColors: Record<string, string> = {
  climate: '#00b4d8',
  disease: '#ef233c',
  economy: '#f4a261',
  ecology: '#52b788',
  population: '#a8dadc',
  infrastructure: '#c77dff',
  agriculture: '#d4a017',
  social: '#74c0fc',
  water: '#8ecae6',
  energy: '#ffb703',
  meta: '#6c7a92',
  unknown: '#91a5c2',
}

export const timelineSeries = [
  { month: '2024-01', rainfall: 20, dengue: 5, foodPrice: 92 },
  { month: '2024-02', rainfall: 24, dengue: 8, foodPrice: 94 },
  { month: '2024-03', rainfall: 28, dengue: 12, foodPrice: 97 },
  { month: '2024-04', rainfall: 38, dengue: 20, foodPrice: 101 },
  { month: '2024-05', rainfall: 45, dengue: 28, foodPrice: 106 },
  { month: '2024-06', rainfall: 52, dengue: 35, foodPrice: 110 },
  { month: '2024-07', rainfall: 49, dengue: 42, foodPrice: 112 },
]

export const timelineEvents = [
  {
    id: 'event-1',
    title: 'Rainfall anomaly detected in Kerala (+38%)',
    date: '2024-06-05',
    severity: 'high',
  },
  {
    id: 'event-2',
    title: 'Dengue outbreak risk elevated in Chennai',
    date: '2024-06-21',
    severity: 'medium',
  },
  {
    id: 'event-3',
    title: 'Food price index spike in Punjab (+18%)',
    date: '2024-06-25',
    severity: 'medium',
  },
]

export const cascadeSteps = [
  'Rainfall anomaly intensifies',
  'Mosquito breeding conditions surge',
  'Dengue incidence accelerates',
  'Healthcare system stress rises',
  'Labor productivity declines',
]

export const briefingData = {
  headline: 'Monsoon rainfall surge raises dengue risk in South India',
  classification: 'UNCLASSIFIED // FOR DEMONSTRATION',
  situationSummary:
    'Rainfall anomalies above 35% persist across Kerala and Tamil Nadu, increasing mosquito breeding indices. Early dengue case signals indicate rising transmission risk for coastal districts.',
  contributingFactors: [
    'Sustained precipitation and humidity over 4 weeks',
    'Urban drainage backlog in coastal districts',
    'Lagged vector-control capacity after prior outbreak',
  ],
  downstreamRisks: [
    {
      risk: 'Escalating dengue hospitalizations',
      domain: 'disease',
      probability: 'HIGH',
      confidenceScore: 82,
      impactScore: 74,
      timeframe: '2-4 weeks',
      pathway: ['Rainfall anomaly expands breeding sites', 'Vector density rises in urban wards', 'Transmission accelerates', 'Admissions increase in district hospitals'],
    },
    {
      risk: 'Healthcare capacity strain in urban wards',
      domain: 'infrastructure',
      probability: 'MEDIUM',
      confidenceScore: 68,
      impactScore: 61,
      timeframe: '1-2 months',
      pathway: ['Case load increases', 'Bed occupancy rises', 'Staffing pressure compounds', 'Non-emergency care slows'],
    },
  ],
  confidenceAssessment: 'MEDIUM - driven by consistent rainfall anomaly metrics and IDSP trend lines.',
  dataGaps: ['Local vector index surveys for inland districts', 'Hospital bed utilization by ward'],
  recommendedMonitoring: ['Weekly dengue case ratio', 'Larval index in coastal wards'],
}

export const heatmapData: Record<string, Array<[number, number, number]>> = {
  disease_dengue: [
    [13.0827, 80.2707, 0.9],
    [12.9716, 77.5946, 0.5],
  ],
  climate_rainfall: [
    [10.1632, 76.6413, 0.8],
    [9.9312, 76.2673, 0.7],
  ],
  ecology_deforestation: [
    [-3.4653, -62.2159, 0.95],
    [-4.2, -61.8, 0.72],
  ],
  economy_food_price: [
    [31.1471, 75.3412, 0.75],
  ],
  population_displacement: [
    [25.0961, 85.3131, 0.65],
  ],
  infrastructure_conflict: [
    [24.5854, 73.7125, 0.6],
  ],
  ecology_wildfire: [
    [-10.0, -55.0, 0.8],
  ],
}

export const mapMarkers = [
  {
    id: 'marker-1',
    position: [13.0827, 80.2707] as [number, number],
    label: 'Dengue Cluster',
  },
  {
    id: 'marker-2',
    position: [10.1632, 76.6413] as [number, number],
    label: 'Rainfall Hotspot',
  },
]

export const datasetRegistry = [
  { name: 'Open-Meteo Historical', domain: 'Climate', source: 'Open-Meteo', update: 'Daily' },
  { name: 'NOAA GSOD', domain: 'Climate', source: 'NOAA', update: 'Daily' },
  { name: 'IMD Gridded Rainfall', domain: 'Climate', source: 'IMD', update: 'Daily' },
  { name: 'ERA5 Reanalysis', domain: 'Climate', source: 'Copernicus', update: 'Monthly' },
  { name: 'Global Flood Database', domain: 'Climate', source: 'Cloud to Street', update: 'Annual' },
  { name: 'WHO GHO', domain: 'Disease', source: 'WHO', update: 'Annual' },
  { name: 'IDSP India', domain: 'Disease', source: 'MoHFW', update: 'Weekly' },
  { name: 'OWID COVID-19', domain: 'Disease', source: 'Our World in Data', update: 'Daily' },
  { name: 'ProMED Alerts', domain: 'Disease', source: 'ISID', update: 'Realtime' },
  { name: 'OpenAQ', domain: 'Disease/Climate', source: 'OpenAQ', update: 'Hourly' },
  { name: 'World Bank Open Data', domain: 'Economy', source: 'World Bank', update: 'Annual' },
  { name: 'FAO Food Price Index', domain: 'Economy', source: 'FAO', update: 'Monthly' },
  { name: 'IMF WEO', domain: 'Economy', source: 'IMF', update: 'Biannual' },
  { name: 'MoSPI India', domain: 'Economy', source: 'MoSPI', update: 'Monthly' },
  { name: 'UN COMTRADE', domain: 'Economy', source: 'UN', update: 'Monthly' },
  { name: 'FAOSTAT Crops', domain: 'Agriculture', source: 'FAO', update: 'Annual' },
  { name: 'NASA MODIS NDVI', domain: 'Agriculture', source: 'NASA', update: '16-day' },
  { name: 'USDA NASS', domain: 'Agriculture', source: 'USDA', update: 'Weekly' },
  { name: 'JRC MARS Agro', domain: 'Agriculture', source: 'JRC', update: 'Monthly' },
  { name: 'UN World Population', domain: 'Population', source: 'UNDESA', update: 'Annual' },
  { name: 'UNHCR Displacement', domain: 'Population', source: 'UNHCR', update: 'Annual' },
  { name: 'India Census', domain: 'Population', source: 'Registrar General', update: 'Decadal' },
  { name: 'WorldPop Gridded', domain: 'Population', source: 'Southampton', update: 'Annual' },
  { name: 'GBIF Biodiversity', domain: 'Ecology', source: 'GBIF', update: 'Realtime' },
  { name: 'IUCN Red List', domain: 'Ecology', source: 'IUCN', update: 'Annual' },
  { name: 'Global Forest Watch', domain: 'Ecology', source: 'WRI', update: 'Annual' },
  { name: 'Copernicus Land Cover', domain: 'Ecology', source: 'Copernicus', update: 'Annual' },
  { name: 'NASA FIRMS Fires', domain: 'Ecology', source: 'NASA', update: 'Realtime' },
  { name: 'OSM Overpass', domain: 'Infrastructure', source: 'OpenStreetMap', update: 'Realtime' },
  { name: 'Global Power Plants', domain: 'Infrastructure', source: 'WRI', update: 'Annual' },
  { name: 'ACLED Conflict', domain: 'Infrastructure', source: 'ACLED', update: 'Weekly' },
  { name: 'HDX Humanitarian', domain: 'Infrastructure', source: 'OCHA', update: 'Variable' },
  { name: 'IGRAC Groundwater', domain: 'Water', source: 'UN-IGRAC', update: 'Annual' },
  { name: 'JRC Surface Water', domain: 'Water', source: 'JRC', update: 'Annual' },
  { name: 'Copernicus Marine', domain: 'Water', source: 'CMEMS', update: 'Daily' },
  { name: 'Global Carbon Project', domain: 'Energy', source: 'GCP/OWID', update: 'Annual' },
  { name: 'UNDP HDI', domain: 'Social', source: 'UNDP', update: 'Annual' },
  { name: 'V-Dem Democracy', domain: 'Social', source: 'V-Dem', update: 'Annual' },
  { name: 'WHO/UNICEF WASH', domain: 'Social', source: 'JMP', update: 'Annual' },
]
