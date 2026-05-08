import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/api'
import type { Domain, GraphEdge, GraphNode } from '../lib/mockData'
import { graphEdges, graphNodes } from '../lib/mockData'
import { useGraphStore } from '../store/graphStore'

type GraphPayload = {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function toDomain(value: unknown): Domain {
  const candidate = typeof value === 'string' ? value.toLowerCase() : ''
  if (
    candidate === 'climate' ||
    candidate === 'disease' ||
    candidate === 'economy' ||
    candidate === 'ecology' ||
    candidate === 'population' ||
    candidate === 'infrastructure'
  ) {
    return candidate
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
  if (!record) {
    return null
  }

  const id = typeof record.id === 'string' ? record.id : undefined
  const label = typeof record.label === 'string' ? record.label : undefined
  if (!id || !label) {
    return null
  }

  const properties = asRecord(record.properties)

  return {
    id,
    label,
    domain: toDomain(record.domain),
    entityType: typeof record.entityType === 'string' ? record.entityType : 'UnknownEntity',
    severity: toNumber(record.severity, 5),
    validFrom:
      typeof record.validFrom === 'string'
        ? record.validFrom
        : typeof record.valid_from === 'string'
          ? record.valid_from
          : '1970-01-01',
    validTo:
      typeof record.validTo === 'string'
        ? record.validTo
        : typeof record.valid_to === 'string'
          ? record.valid_to
          : undefined,
    source: typeof record.source === 'string' ? record.source : 'Unknown',
    lat: toOptionalNumber(record.lat) ?? toOptionalNumber(record.latitude),
    lon: toOptionalNumber(record.lon) ?? toOptionalNumber(record.longitude),
    properties: properties
      ? Object.entries(properties).reduce<Record<string, string | number>>((acc, [key, value]) => {
          if (typeof value === 'string' || typeof value === 'number') {
            acc[key] = value
          }
          return acc
        }, {})
      : undefined,
  }
}

function toGraphEdge(input: unknown, index: number): GraphEdge | null {
  const record = asRecord(input)
  if (!record) {
    return null
  }

  const source = typeof record.source === 'string' ? record.source : undefined
  const target = typeof record.target === 'string' ? record.target : undefined
  if (!source || !target) {
    return null
  }

  const id = typeof record.id === 'string' ? record.id : `edge-${source}-${target}-${index}`

  return {
    id,
    source,
    target,
    relationship: typeof record.relationship === 'string' ? record.relationship : 'RELATES_TO',
    confidence: toNumber(record.confidence, 0.5),
    lagWeeks: toNumber(record.lagWeeks, toNumber(record.lag_weeks, 0)),
    sourceDataset:
      typeof record.sourceDataset === 'string'
        ? record.sourceDataset
        : typeof record.source_dataset === 'string'
          ? record.source_dataset
          : 'Unknown',
    evidenceType:
      typeof record.evidenceType === 'string'
        ? record.evidenceType
        : typeof record.evidence_type === 'string'
          ? record.evidence_type
          : 'unknown',
  }
}

function normalizeGraphPayload(payload: unknown): GraphPayload | null {
  const top = asRecord(payload)
  if (!top) {
    return null
  }

  const nested = asRecord(top.data)
  const nodeSource =
    (Array.isArray(top.nodes) ? top.nodes : undefined) ??
    (nested && Array.isArray(nested.nodes) ? nested.nodes : undefined)
  const edgeSource =
    (Array.isArray(top.edges) ? top.edges : undefined) ??
    (nested && Array.isArray(nested.edges) ? nested.edges : undefined)

  if (!nodeSource || !edgeSource) {
    return null
  }

  const nodes = nodeSource
    .map((item) => toGraphNode(item))
    .filter((item): item is GraphNode => Boolean(item))
  const edges = edgeSource
    .map((item, index) => toGraphEdge(item, index))
    .filter((item): item is GraphEdge => Boolean(item))

  return { nodes, edges }
}

export function useGraph() {
  const currentDate = useGraphStore((state) => state.currentDate)
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId)
  const minConfidence = useGraphStore((state) => state.minConfidence)
  const searchTerm = useGraphStore((state) => state.searchTerm.toLowerCase())

  const query = useQuery({
    queryKey: ['graph', selectedNodeId, currentDate],
    queryFn: async (): Promise<GraphPayload | null> => {
      const endpoint = selectedNodeId
        ? `/api/graph/expand/${encodeURIComponent(selectedNodeId)}?date=${encodeURIComponent(currentDate)}`
        : `/api/graph/concepts?date=${encodeURIComponent(currentDate)}`

      const payload = await apiClient(endpoint)
      return normalizeGraphPayload(payload)
    },
    retry: 1,
    staleTime: 60_000,
  })

  const sourceNodes = query.data?.nodes?.length ? query.data.nodes : graphNodes
  const sourceEdges = query.data?.edges?.length ? query.data.edges : graphEdges

  const nodes = sourceNodes.filter((node) =>
    searchTerm ? node.label.toLowerCase().includes(searchTerm) : true,
  )

  const nodeIds = new Set(nodes.map((node) => node.id))

  const edges = sourceEdges.filter(
    (edge) => edge.confidence >= minConfidence && nodeIds.has(edge.source) && nodeIds.has(edge.target),
  )

  return {
    nodes,
    edges,
    isLoading: query.isLoading,
    isUsingFallback: !query.data,
    error: query.error,
  }
}
