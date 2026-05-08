import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/api'
import { mapMarkers } from '../lib/mockData'
import { useMapStore } from '../store/mapStore'
import { useGraphStore } from '../store/graphStore'

type Overlay = {
  id: string
  position: [number, number]
  label?: string
  properties?: Record<string, unknown>
}

type GeoJsonPointFeature = {
  id?: string | number
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties?: Record<string, unknown>
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function normalizeOverlayItem(item: unknown): Overlay | null {
  const rec = asRecord(item)
  if (!rec) return null

  // GeoJSON point feature
  if (rec.type === 'Feature') {
    const geometry = asRecord(rec.geometry)
    const properties = asRecord(rec.properties) ?? undefined
    const coordinates = geometry && Array.isArray(geometry.coordinates) ? geometry.coordinates : undefined

    if (
      geometry?.type === 'Point' &&
      coordinates?.length >= 2 &&
      typeof coordinates[0] === 'number' &&
      typeof coordinates[1] === 'number'
    ) {
      const feature: GeoJsonPointFeature = {
        id: typeof rec.id === 'string' || typeof rec.id === 'number' ? rec.id : undefined,
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [coordinates[0], coordinates[1]],
        },
        properties,
      }

      const [lon, lat] = feature.geometry.coordinates
      const propertyId = properties && (typeof properties.id === 'string' || typeof properties.id === 'number') ? properties.id : undefined
      const label =
        properties && typeof properties.label === 'string'
          ? properties.label
          : properties && typeof properties.name === 'string'
            ? properties.name
            : undefined

      return {
        id: String(feature.id ?? propertyId ?? `${lat},${lon}`),
        position: [lat, lon],
        label,
        properties,
      }
    }
  }

  // simple object with lat / lon or latitude / longitude
  const lat = typeof rec.lat === 'number' ? rec.lat : typeof rec.latitude === 'number' ? rec.latitude : undefined
  const lon = typeof rec.lon === 'number' ? rec.lon : typeof rec.longitude === 'number' ? rec.longitude : undefined
  if (typeof lat === 'number' && typeof lon === 'number') {
    return { id: String(rec.id ?? `${lat},${lon}`), position: [lat, lon], label: typeof rec.label === 'string' ? rec.label : typeof rec.name === 'string' ? rec.name : undefined, properties: rec }
  }

  return null
}

function normalizeOverlays(payload: unknown): Overlay[] | null {
  if (!payload) return null

  if (Array.isArray(payload)) {
    const items = payload.map((i) => normalizeOverlayItem(i)).filter((i): i is Overlay => Boolean(i))
    return items.length ? items : null
  }

  const top = asRecord(payload)
  if (!top) return null

  const data = top.data ?? top.items ?? top.features ?? null
  if (!data) return null

  if (Array.isArray(data)) {
    const items = data.map((i) => normalizeOverlayItem(i)).filter((i): i is Overlay => Boolean(i))
    return items.length ? items : null
  }

  return null
}

export function useMapOverlays() {
  const activeLayers = useMapStore((s) => s.activeLayers)
  const currentDate = useGraphStore((s) => s.currentDate)

  const query = useQuery({
    queryKey: ['map-overlays', activeLayers.join(','), currentDate],
    queryFn: async () => {
      const layersParam = activeLayers.map(encodeURIComponent).join(',')
      const endpoint = `/api/map/overlay?layers=${layersParam}&date=${encodeURIComponent(currentDate)}`
      const payload = await apiClient(endpoint)
      return normalizeOverlays(payload)
    },
    retry: 1,
    staleTime: 5 * 60_000,
  })

  const overlays = query.data && query.data.length
    ? query.data
    : mapMarkers.map((marker) => ({ id: marker.id, position: marker.position, label: marker.label }))

  return { overlays, isFetching: query.isFetching }
}
