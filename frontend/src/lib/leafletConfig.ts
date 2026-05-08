export const MAP_LAYERS = {
  disease_dengue: {
    label: 'Dengue Risk',
    color: '#ef233c',
    domain: 'disease',
    endpoint: '/api/map/heatmap?layer=disease_dengue',
  },
  climate_rainfall: {
    label: 'Rainfall Anomaly',
    color: '#00b4d8',
    domain: 'climate',
    endpoint: '/api/map/heatmap?layer=climate_rainfall',
  },
  ecology_deforestation: {
    label: 'Deforestation',
    color: '#52b788',
    domain: 'ecology',
    endpoint: '/api/map/heatmap?layer=ecology_deforestation',
  },
  economy_food_price: {
    label: 'Food Price Stress',
    color: '#f4a261',
    domain: 'economy',
    endpoint: '/api/map/heatmap?layer=economy_food_price',
  },
  population_displacement: {
    label: 'Displacement Events',
    color: '#a8dadc',
    domain: 'population',
    endpoint: '/api/map/heatmap?layer=population_displacement',
  },
  infrastructure_conflict: {
    label: 'Conflict Events',
    color: '#c77dff',
    domain: 'infrastructure',
    endpoint: '/api/map/heatmap?layer=infrastructure_conflict',
  },
  ecology_wildfire: {
    label: 'Active Wildfires',
    color: '#ff6b35',
    domain: 'ecology',
    endpoint: '/api/map/heatmap?layer=ecology_wildfire',
  },
}

export const TILE_PROVIDERS = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  terrain: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png',
}
