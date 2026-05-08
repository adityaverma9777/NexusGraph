import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/api'
import { MAP_LAYERS } from '../lib/leafletConfig'
import { useMapStore } from '../store/mapStore'

type MapLayerDefinition = {
  id: string
  label: string
  color: string
  domain: string
  endpoint: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function toLayerDefinition(id: string, input: unknown): MapLayerDefinition | null {
  const record = asRecord(input)
  if (!record) {
    return null
  }

  return {
    id,
    label: typeof record.label === 'string' ? record.label : id,
    color: typeof record.color === 'string' ? record.color : '#6a6374',
    domain: typeof record.domain === 'string' ? record.domain : 'unknown',
    endpoint:
      typeof record.endpoint === 'string' ? record.endpoint : `/api/map/heatmap?layer=${encodeURIComponent(id)}`,
  }
}

function normalizeMapLayers(payload: unknown): MapLayerDefinition[] | null {
  if (Array.isArray(payload)) {
    const layers = payload
      .map((item) => {
        const record = asRecord(item)
        const id = record && typeof record.id === 'string' ? record.id : undefined
        if (!id) {
          return null
        }
        return toLayerDefinition(id, item)
      })
      .filter((item): item is MapLayerDefinition => Boolean(item))
    return layers.length ? layers : null
  }

  const top = asRecord(payload)
  if (!top) {
    return null
  }

  const nested = asRecord(top.data)
  const objectSource =
    (asRecord(top.layers) ?? asRecord(top.items) ?? asRecord(nested?.layers) ?? asRecord(nested?.items))

  if (!objectSource) {
    return null
  }

  const layers = Object.entries(objectSource)
    .map(([id, value]) => toLayerDefinition(id, value))
    .filter((item): item is MapLayerDefinition => Boolean(item))

  return layers.length ? layers : null
}

export function useMapLayers() {
  const activeLayers = useMapStore((state) => state.activeLayers)
  const setActiveLayers = useMapStore((state) => state.setActiveLayers)

  const query = useQuery({
    queryKey: ['map-layers'],
    queryFn: async () => {
      const payload = await apiClient('/api/map/layers')
      return normalizeMapLayers(payload)
    },
    retry: 1,
    staleTime: 10 * 60_000,
  })

  const layerEntries = query.data?.length
    ? query.data
    : Object.entries(MAP_LAYERS).map(([id, layer]) => ({ id, ...layer }))

  return { activeLayers, setActiveLayers, layerEntries, isFetching: query.isFetching }
}
