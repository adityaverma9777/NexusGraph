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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function normalizeOverlayItem(item: unknown): Overlay | null {
  const rec = asRecord(item)
  if (!rec) return null

  const anyRec = rec as any

  // GeoJSON feature
  if (anyRec.type === 'Feature' && anyRec.geometry && anyRec.geometry.type === 'Point' && Array.isArray(anyRec.geometry.coordinates)) {
    const [lon, lat] = anyRec.geometry.coordinates as number[]
    return { id: String(anyRec.id ?? anyRec.properties?.id ?? `${lat},${lon}`), position: [lat, lon], label: String(anyRec.properties?.label ?? anyRec.properties?.name ?? '') , properties: anyRec.properties as Record<string, unknown> }
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

  const overlays = query.data && query.data.length ? query.data : mapMarkers.map((m) => ({ id: m.id, position: m.position, label: m.label }))

  return { overlays, isFetching: query.isFetching }
}
