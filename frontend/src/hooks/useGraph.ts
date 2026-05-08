import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/api'
import type { Domain, GraphEdge, GraphNode } from '../lib/mockData'
import { useGraphStore } from '../store/graphStore'

type GraphPayload = {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function toDomain(value: unknown): Domain {
  const candidate = typeof value === 'string' ? value.toLowerCase() : ''
  if (['climate', 'disease', 'economy', 'ecology', 'population', 'infrastructure'].includes(candidate)) {
    return candidate as Domain
  }
  return 'climate'
}

function toNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function toOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function toGraphNode(input: unknown): GraphNode | null {
  const record = asRecord(input)
  if (!record) return null
  const id = typeof record.id === 'string' ? record.id : undefined
  const label = typeof record.label === 'string' ? record.label : undefined
  if (!id || !label) return null
  const properties = asRecord(record.properties)
  return {
    id,
    label,
    domain: toDomain(record.domain),
    entityType: typeof record.entityType === 'string' ? record.entityType : typeof record.entity_type === 'string' ? record.entity_type : 'UnknownEntity',
    severity: toNumber(record.severity, 5),
    validFrom: typeof record.validFrom === 'string' ? record.validFrom : typeof record.valid_from === 'string' ? record.valid_from : '1970-01-01',
    validTo: typeof record.validTo === 'string' ? record.validTo : typeof record.valid_to === 'string' ? record.valid_to : undefined,
    source: typeof record.source === 'string' ? record.source : 'Unknown',
    lat: toOptionalNumber(record.lat) ?? toOptionalNumber(record.latitude),
    lon: toOptionalNumber(record.lon) ?? toOptionalNumber(record.longitude),
    properties: properties
      ? Object.entries(properties).reduce<Record<string, string | number>>((acc, [key, value]) => {
          if (typeof value === 'string' || typeof value === 'number') acc[key] = value
          return acc
        }, {})
      : undefined,
  }
}

function toGraphEdge(input: unknown, index: number): GraphEdge | null {
  const record = asRecord(input)
  if (!record) return null
  const source = typeof record.source === 'string' ? record.source : undefined
  const target = typeof record.target === 'string' ? record.target : undefined
  if (!source || !target) return null
  const id = typeof record.id === 'string' ? record.id : `edge-${source}-${target}-${index}`
  return {
    id,
    source,
    target,
    relationship: typeof record.relationship === 'string' ? record.relationship : 'RELATES_TO',
    confidence: toNumber(record.confidence, 0.5),
    lagWeeks: toNumber(record.lagWeeks ?? record.lag_weeks, 0),
    sourceDataset: typeof record.sourceDataset === 'string' ? record.sourceDataset : typeof record.source_dataset === 'string' ? record.source_dataset : 'Unknown',
    evidenceType: typeof record.evidenceType === 'string' ? record.evidenceType : typeof record.evidence_type === 'string' ? record.evidence_type : 'unknown',
  }
}

function normalizeGraphPayload(payload: unknown): GraphPayload | null {
  const top = asRecord(payload)
  if (!top) return null
  const nested = asRecord(top.data)
  const nodeSource = (Array.isArray(top.nodes) ? top.nodes : undefined) ?? (nested && Array.isArray(nested.nodes) ? nested.nodes : undefined)
  const edgeSource = (Array.isArray(top.edges) ? top.edges : undefined) ?? (nested && Array.isArray(nested.edges) ? nested.edges : undefined)
  if (!nodeSource) return null
  const nodes = nodeSource.map((item) => toGraphNode(item)).filter((item): item is GraphNode => Boolean(item))
  const edges = (edgeSource ?? []).map((item, index) => toGraphEdge(item, index)).filter((item): item is GraphEdge => Boolean(item))
  return { nodes, edges }
}

export function useGraph() {
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId)
  const cascadeType = useGraphStore((state) => state.cascadeType)
  const searchQuery = useGraphStore((state) => state.searchQuery)

  const hasQuery = Boolean(selectedNodeId || cascadeType || searchQuery)

  const query = useQuery({
    queryKey: ['graph', selectedNodeId, cascadeType, searchQuery],
    enabled: hasQuery,
    queryFn: async (): Promise<GraphPayload | null> => {
      if (cascadeType) {
        const payload = await apiClient(`/api/graph/cascade/${encodeURIComponent(cascadeType)}`)
        return normalizeGraphPayload(payload)
      }
      if (selectedNodeId) {
        const payload = await apiClient(`/api/graph/expand/${encodeURIComponent(selectedNodeId)}?hops=1`)
        return normalizeGraphPayload(payload)
      }
      if (searchQuery) {
        const payload = await apiClient(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=10`)
        if (Array.isArray(payload)) {
          const nodes = payload.map((item) => toGraphNode(item)).filter((item): item is GraphNode => Boolean(item))
          return { nodes, edges: [] }
        }
        return normalizeGraphPayload(payload)
      }
      return null
    },
    retry: 1,
    staleTime: 60_000,
  })

  return {
    nodes: query.data?.nodes ?? [],
    edges: query.data?.edges ?? [],
    isLoading: query.isLoading && hasQuery,
    hasQuery,
    error: query.error,
  }
}
