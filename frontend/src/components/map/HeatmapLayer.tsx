import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'
import { useMapStore } from '../../store/mapStore'
import { heatmapData } from '../../lib/mockData'
import { MAP_LAYERS } from '../../lib/leafletConfig'

export default function HeatmapLayer() {
  const map = useMap()
  const activeLayers = useMapStore((state) => state.activeLayers)

  useEffect(() => {
    if (!map) return

    // Clear existing heatmap layers
    const existingLayers: L.Layer[] = []
    map.eachLayer((layer) => {
      if (layer instanceof (L as any).HeatLayer) {
        existingLayers.push(layer)
      }
    })
    existingLayers.forEach((layer) => map.removeLayer(layer))

    // Add active heatmap layers
    activeLayers.forEach((layerId) => {
      const data = heatmapData[layerId]
      const layerConfig = MAP_LAYERS[layerId as keyof typeof MAP_LAYERS]

      if (data && layerConfig) {
        ;(L as any)
          .heatLayer(data, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            min: 0,
            max: 1,
            gradient: { 0.2: layerConfig.color, 0.6: '#ffff00', 1: '#ff0000' },
          })
          .addTo(map)
      }
    })
  }, [map, activeLayers])

  return null
}
