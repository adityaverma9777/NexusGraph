import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/api'
import { getLayerIdForEntityType } from '../lib/leafletConfig'
import { useMapStore } from '../store/mapStore'
import { useGraphStore } from '../store/graphStore'

export type MapOverlay = {
  id: string
  position: [number, number]
  label?: string
  domain?: string
  entityType?: string
  layerId?: string
  severity?: number
  relationshipCount?: number
  relationships?: Array<{ relationship?: string; peer_label?: string; peer_id?: string; confidence?: number }>
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

function resolveEntityType(record: Record<string, unknown>) {
  return typeof record.entity_type === 'string'
    ? record.entity_type
    : typeof record.entityType === 'string'
      ? record.entityType
      : undefined
}

function normalizeOverlayItem(item: unknown): MapOverlay | null {
  const rec = asRecord(item)
  if (!rec) return null

  const entityType = resolveEntityType(rec)
  const layerId = getLayerIdForEntityType(entityType)

  if (Array.isArray(rec.position) && rec.position.length >= 2) {
    const lat = rec.position[0]
    const lon = rec.position[1]
    if (typeof lat === 'number' && typeof lon === 'number') {
      return {
        id: String(rec.id ?? `${lat},${lon}`),
        position: [lat, lon],
        label: typeof rec.label === 'string' ? rec.label : typeof rec.name === 'string' ? rec.name : undefined,
        domain: typeof rec.domain === 'string' ? rec.domain : undefined,
        entityType,
        layerId,
        severity: typeof rec.severity === 'number' ? rec.severity : typeof rec.metric_value === 'number' ? rec.metric_value : undefined,
        relationshipCount: typeof rec.relationship_count === 'number' ? rec.relationship_count : undefined,
        relationships: Array.isArray(rec.relationships) ? (rec.relationships as Array<{ relationship?: string; peer_label?: string; peer_id?: string; confidence?: number }>) : undefined,
        properties: asRecord(rec.properties) ?? rec,
      }
    }
  }

  if (rec.type === 'Feature') {
    const geometry = asRecord(rec.geometry)
    const properties = asRecord(rec.properties) ?? undefined
    const coordinates = geometry && Array.isArray(geometry.coordinates) ? geometry.coordinates : []

    if (geometry?.type === 'Point' && coordinates.length >= 2) {
      const lon = coordinates[0]
      const lat = coordinates[1]
      if (typeof lon !== 'number' || typeof lat !== 'number') {
        return null
      }

      const feature: GeoJsonPointFeature = {
        id: typeof rec.id === 'string' || typeof rec.id === 'number' ? rec.id : undefined,
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lon, lat],
        },
        properties,
      }

      const propertyEntityType = properties ? resolveEntityType(properties) : undefined
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
        domain: typeof properties?.domain === 'string' ? properties.domain : undefined,
        entityType: propertyEntityType,
        layerId: getLayerIdForEntityType(propertyEntityType),
        severity: typeof properties?.severity === 'number' ? properties.severity : typeof properties?.metric_value === 'number' ? properties.metric_value : undefined,
        relationshipCount: typeof properties?.relationship_count === 'number' ? properties.relationship_count : undefined,
        relationships: Array.isArray(properties?.relationships) ? (properties.relationships as Array<{ relationship?: string; peer_label?: string; peer_id?: string; confidence?: number }>) : undefined,
        properties,
      }
    }
  }

  const lat = typeof rec.lat === 'number' ? rec.lat : typeof rec.latitude === 'number' ? rec.latitude : undefined
  const lon = typeof rec.lon === 'number' ? rec.lon : typeof rec.longitude === 'number' ? rec.longitude : undefined
  if (typeof lat === 'number' && typeof lon === 'number') {
    return {
      id: String(rec.id ?? `${lat},${lon}`),
      position: [lat, lon],
      label: typeof rec.label === 'string' ? rec.label : typeof rec.name === 'string' ? rec.name : undefined,
      domain: typeof rec.domain === 'string' ? rec.domain : undefined,
      entityType,
      layerId,
      severity: typeof rec.severity === 'number' ? rec.severity : typeof rec.metric_value === 'number' ? rec.metric_value : undefined,
      relationshipCount: typeof rec.relationship_count === 'number' ? rec.relationship_count : undefined,
      relationships: Array.isArray(rec.relationships) ? (rec.relationships as Array<{ relationship?: string; peer_label?: string; peer_id?: string; confidence?: number }>) : undefined,
      properties: rec,
    }
  }

  return null
}

function normalizeOverlays(payload: unknown): MapOverlay[] | null {
  if (!payload) return null

  if (Array.isArray(payload)) {
    const items = payload.map((item) => normalizeOverlayItem(item)).filter((item): item is MapOverlay => Boolean(item))
    return items.length ? items : null
  }

  const top = asRecord(payload)
  if (!top) return null

  const data = top.data ?? top.items ?? top.features ?? null
  if (!data) return null

  if (Array.isArray(data)) {
    const items = data.map((item) => normalizeOverlayItem(item)).filter((item): item is MapOverlay => Boolean(item))
    return items.length ? items : null
  }

  return null
}

export function useMapOverlays() {
  const activeLayers = useMapStore((state) => state.activeLayers)
  const currentDate = useGraphStore((state) => state.currentDate)

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

  const overlays = query.data ?? []

  return { overlays, isFetching: query.isFetching }
}
