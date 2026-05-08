import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'
import { apiClient } from '../../lib/api'
import { useMapStore } from '../../store/mapStore'
import { heatmapData } from '../../lib/mockData'
import { MAP_LAYERS } from '../../lib/leafletConfig'
import { useGraphStore } from '../../store/graphStore'

type HeatPoint = [number, number, number]

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function toHeatPoint(input: unknown): HeatPoint | null {
  if (Array.isArray(input) && input.length >= 3) {
    const lat = Number(input[0])
    const lon = Number(input[1])
    const intensity = Number(input[2])
    if (Number.isFinite(lat) && Number.isFinite(lon) && Number.isFinite(intensity)) {
      return [lat, lon, intensity]
    }
  }

  const record = asRecord(input)
  if (!record) {
    return null
  }

  const lat = Number(record.lat ?? record.latitude)
  const lon = Number(record.lon ?? record.longitude)
  const intensity = Number(record.intensity ?? record.value ?? 0.5)
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(intensity)) {
    return null
  }

  return [lat, lon, intensity]
}

function normalizeHeatmapPayload(payload: unknown): HeatPoint[] | null {
  if (Array.isArray(payload)) {
    const points = payload.map((entry) => toHeatPoint(entry)).filter((entry): entry is HeatPoint => Boolean(entry))
    return points.length ? points : null
  }

  const record = asRecord(payload)
  if (!record) {
    return null
  }

  const nested = asRecord(record.data)
  const source =
    (Array.isArray(record.points) ? record.points : undefined) ??
    (Array.isArray(record.heatmap) ? record.heatmap : undefined) ??
    (Array.isArray(nested?.points) ? nested.points : undefined)

  if (!source) {
    return null
  }

  const points = source.map((entry) => toHeatPoint(entry)).filter((entry): entry is HeatPoint => Boolean(entry))
  return points.length ? points : null
}

export default function HeatmapLayer() {
  const map = useMap()
  const activeLayers = useMapStore((state) => state.activeLayers)
  const currentDate = useGraphStore((state) => state.currentDate)

  const query = useQuery({
    queryKey: ['map-heatmap', activeLayers, currentDate],
    queryFn: async () => {
      const entries = await Promise.all(
        activeLayers.map(async (layerId) => {
          const endpoint = `/api/map/heatmap?layer=${encodeURIComponent(layerId)}&date=${encodeURIComponent(currentDate)}`
          const payload = await apiClient(endpoint)
          return [layerId, normalizeHeatmapPayload(payload)] as const
        }),
      )

      return entries.reduce<Record<string, HeatPoint[]>>((acc, [layerId, points]) => {
        if (points?.length) {
          acc[layerId] = points
        }
        return acc
      }, {})
    },
    enabled: activeLayers.length > 0,
    retry: 1,
    staleTime: 60_000,
  })

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
      const data = query.data?.[layerId] ?? heatmapData[layerId]
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
  }, [map, activeLayers, query.data])

  return null
}
