import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { apiClient } from '../../lib/api'
import type { GraphEdge, GraphNode } from '../../lib/mockData'
import { graphEdges, graphNodes } from '../../lib/mockData'
import { useGraphStore } from '../../store/graphStore'

type SearchResultItem = {
  id: string
  label: string
  domain: string
  entityType: string
  severity: number
  source: string
}

type SearchResultsPayload = {
  items: SearchResultItem[]
  page: number
  totalPages: number
  total: number
}

type RelationshipPreview = {
  edgeId: string
  relationship: string
  peerLabel: string
  direction: 'outbound' | 'inbound'
  confidence: number
  lagWeeks: number
}

const PAGE_SIZE = 6

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function toNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function toSearchItem(input: unknown): SearchResultItem | null {
  const record = asRecord(input)
  if (!record) {
    return null
  }

  const id = typeof record.id === 'string' ? record.id : undefined
  const label = typeof record.label === 'string' ? record.label : undefined
  if (!id || !label) {
    return null
  }

  return {
    id,
    label,
    domain: typeof record.domain === 'string' ? record.domain : 'unknown',
    entityType: typeof record.entityType === 'string' ? record.entityType : 'UnknownEntity',
    severity: toNumber(record.severity, 0),
    source: typeof record.source === 'string' ? record.source : 'Unknown',
  }
}

function normalizeSearchPayload(payload: unknown, page: number): SearchResultsPayload | null {
  const top = asRecord(payload)
  if (!top) {
    return null
  }

  const nested = asRecord(top.data)
  const source =
    (Array.isArray(top.results) ? top.results : undefined) ??
    (Array.isArray(top.items) ? top.items : undefined) ??
    (Array.isArray(top.nodes) ? top.nodes : undefined) ??
    (Array.isArray(nested?.results) ? nested.results : undefined) ??
    (Array.isArray(nested?.items) ? nested.items : undefined) ??
    (Array.isArray(nested?.nodes) ? nested.nodes : undefined)

  if (!source) {
    return null
  }

  const items = source.map((entry) => toSearchItem(entry)).filter((entry): entry is SearchResultItem => Boolean(entry))
  const total =
    toNumber(top.total, NaN) ||
    toNumber(top.total_count, NaN) ||
    toNumber(nested?.total, NaN) ||
    toNumber(nested?.total_count, NaN) ||
    items.length

  const totalPages =
    toNumber(top.total_pages, NaN) ||
    toNumber(nested?.total_pages, NaN) ||
    Math.max(1, Math.ceil(total / PAGE_SIZE))

  const currentPage =
    toNumber(top.page, NaN) ||
    toNumber(nested?.page, NaN) ||
    page

  return {
    items,
    page: Math.max(1, currentPage),
    totalPages: Math.max(1, totalPages),
    total,
  }
}

function fallbackResults(term: string, page: number): SearchResultsPayload {
  const lowerTerm = term.toLowerCase()
  const all = graphNodes
    .filter((node) => node.label.toLowerCase().includes(lowerTerm))
    .map((node) => ({
      id: node.id,
      label: node.label,
      domain: node.domain,
      entityType: node.entityType,
      severity: node.severity,
      source: node.source,
    }))

  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE

  return {
    items: all.slice(start, end),
    page: safePage,
    totalPages,
    total: all.length,
  }
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

  return {
    id,
    label,
    domain: typeof record.domain === 'string' ? (record.domain as GraphNode['domain']) : 'climate',
    entityType: typeof record.entityType === 'string' ? record.entityType : 'UnknownEntity',
    severity: toNumber(record.severity, 0),
    validFrom: typeof record.validFrom === 'string' ? record.validFrom : '1970-01-01',
    validTo: typeof record.validTo === 'string' ? record.validTo : undefined,
    source: typeof record.source === 'string' ? record.source : 'Unknown',
  }
}

function toGraphEdge(input: unknown): GraphEdge | null {
  const record = asRecord(input)
  if (!record) {
    return null
  }

  const source = typeof record.source === 'string' ? record.source : undefined
  const target = typeof record.target === 'string' ? record.target : undefined
  if (!source || !target) {
    return null
  }

  return {
    id: typeof record.id === 'string' ? record.id : `edge-${source}-${target}`,
    source,
    target,
    relationship: typeof record.relationship === 'string' ? record.relationship : 'RELATES_TO',
    confidence: toNumber(record.confidence, 0),
    lagWeeks: toNumber(record.lagWeeks ?? record.lag_weeks, 0),
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

function normalizeExpandPayload(payload: unknown): { nodes: GraphNode[]; edges: GraphEdge[] } | null {
  const top = asRecord(payload)
  if (!top) {
    return null
  }

  const nested = asRecord(top.data)
  const nodeSource =
    (Array.isArray(top.nodes) ? top.nodes : undefined) ??
    (Array.isArray(nested?.nodes) ? nested.nodes : undefined)
  const edgeSource =
    (Array.isArray(top.edges) ? top.edges : undefined) ??
    (Array.isArray(nested?.edges) ? nested.edges : undefined)

  if (!nodeSource || !edgeSource) {
    return null
  }

  const nodes = nodeSource.map((entry) => toGraphNode(entry)).filter((entry): entry is GraphNode => Boolean(entry))
  const edges = edgeSource.map((entry) => toGraphEdge(entry)).filter((entry): entry is GraphEdge => Boolean(entry))

  return { nodes, edges }
}

function buildRelationshipPreview(
  nodeId: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
): RelationshipPreview[] {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]))

  return edges
    .filter((edge) => edge.source === nodeId || edge.target === nodeId)
    .map((edge) => {
      const outbound = edge.source === nodeId
      const peerId = outbound ? edge.target : edge.source
      const peerLabel = nodeMap.get(peerId)?.label ?? peerId

      return {
        edgeId: edge.id,
        relationship: edge.relationship,
        peerLabel,
        direction: outbound ? ('outbound' as const) : ('inbound' as const),
        confidence: edge.confidence,
        lagWeeks: edge.lagWeeks,
      }
    })
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, 4)
}

export default function ConceptSearch() {
  const searchTerm = useGraphStore((state) => state.searchTerm)
  const setSearchTerm = useGraphStore((state) => state.setSearchTerm)
  const currentDate = useGraphStore((state) => state.currentDate)
  const setSelectedNodeId = useGraphStore((state) => state.setSelectedNodeId)
  const setSelectedEdgeId = useGraphStore((state) => state.setSelectedEdgeId)

  const [submittedTerm, setSubmittedTerm] = useState('')
  const [page, setPage] = useState(1)
  const [focusedResultId, setFocusedResultId] = useState<string | undefined>(undefined)

  const searchQuery = useQuery({
    queryKey: ['concept-search', submittedTerm, page, currentDate],
    queryFn: async () => {
      const payload = await apiClient(
        `/api/search?q=${encodeURIComponent(submittedTerm)}&page=${page}&limit=${PAGE_SIZE}&date=${encodeURIComponent(currentDate)}`,
      )

      return normalizeSearchPayload(payload, page)
    },
    enabled: submittedTerm.length > 0,
    retry: 1,
    staleTime: 60_000,
  })

  const activeResults = useMemo(() => {
    if (!submittedTerm) {
      return null
    }

    if (searchQuery.data?.items?.length || searchQuery.data) {
      return searchQuery.data
    }

    return fallbackResults(submittedTerm, page)
  }, [submittedTerm, searchQuery.data, page])

  useEffect(() => {
    const first = activeResults?.items?.[0]
    if (!first) {
      return
    }

    setSelectedNodeId(first.id)
    setSelectedEdgeId(undefined)
  }, [activeResults?.items, setSelectedNodeId, setSelectedEdgeId])

  const selectResult = (id: string) => {
    setSelectedNodeId(id)
    setSelectedEdgeId(undefined)
    setFocusedResultId(id)
  }

  const previewQuery = useQuery({
    queryKey: ['search-relationship-preview', focusedResultId, currentDate],
    queryFn: async () => {
      const payload = await apiClient(
        `/api/graph/expand/${encodeURIComponent(focusedResultId ?? '')}?date=${encodeURIComponent(currentDate)}`,
      )
      const normalized = normalizeExpandPayload(payload)
      if (!normalized || !focusedResultId) {
        return null
      }

      return buildRelationshipPreview(focusedResultId, normalized.nodes, normalized.edges)
    },
    enabled: Boolean(focusedResultId),
    retry: 1,
    staleTime: 60_000,
  })

  const fallbackPreview = useMemo(() => {
    const activeResultId = focusedResultId ?? activeResults?.items?.[0]?.id
    if (!activeResultId) {
      return []
    }

    return buildRelationshipPreview(activeResultId, graphNodes, graphEdges)
  }, [focusedResultId, activeResults?.items])

  const activeResultId = focusedResultId ?? activeResults?.items?.[0]?.id

  const relationshipPreview =
    previewQuery.data && previewQuery.data.length > 0 ? previewQuery.data : fallbackPreview

  const onExplore = () => {
    const term = searchTerm.trim()
    if (!term) {
      return
    }

    setSubmittedTerm(term)
    setPage(1)
  }

  return (
    <div className="space-y-3 rounded-xl border border-[#24344a] bg-[#0d1828] px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="flex-1 bg-transparent text-sm text-[#dce8f9] placeholder:text-[#6f86a7] focus:outline-none"
          placeholder="Search a concept: rainfall, dengue, food price..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              onExplore()
            }
          }}
        />
        <button
          type="button"
          onClick={onExplore}
          disabled={searchQuery.isPending}
          className="rounded-full border border-[#2f4564] bg-[#193254] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#eaf2ff] hover:bg-[#23456f] disabled:opacity-70"
        >
          {searchQuery.isPending ? 'Exploring...' : 'Explore'}
        </button>
      </div>

      {submittedTerm && activeResults && (
        <div className="rounded-lg border border-[#2a3b53] bg-[#0f1b2d] p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-[#93a8c5]">
              Results · {activeResults.total} matches · "{submittedTerm}"
            </p>
            <p className="text-xs text-[#7990b0]">
              Page {activeResults.page} of {activeResults.totalPages}
            </p>
          </div>

          {activeResults.items.length > 0 ? (
            <ul className="space-y-2">
              {activeResults.items.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => selectResult(result.id)}
                    className={`w-full rounded-md border px-3 py-2 text-left ${
                      activeResultId === result.id
                        ? 'border-[#4e79ab] bg-[#17304d]'
                        : 'border-[#2b3e58] bg-[#122136] hover:border-[#406188] hover:bg-[#162943]'
                    }`}
                  >
                    <p className="text-sm font-medium text-[#e9f2ff]">{result.label}</p>
                    <p className="mt-1 text-xs text-[#9ab0cd]">
                      {result.domain} · {result.entityType} · severity {result.severity.toFixed(1)} · {result.source}
                    </p>
                  </button>
                </li>
              ))}

              {activeResultId && (
                <div className="mt-3 rounded-md border border-[#30445f] bg-[#101d30] p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8ca3c3]">Relationship Snapshot</p>
                  {previewQuery.isFetching && <p className="mt-2 text-xs text-[#7f95b5]">Loading structural links...</p>}
                  {relationshipPreview.length > 0 ? (
                    <ul className="mt-2 space-y-2">
                      {relationshipPreview.map((preview) => (
                        <li key={preview.edgeId} className="rounded border border-[#2d3f59] bg-[#122238] px-3 py-2">
                          <p className="text-xs font-semibold text-[#e6efff]">
                            {preview.relationship} · {preview.peerLabel}
                          </p>
                          <p className="mt-1 text-[11px] text-[#93a9c8]">
                            {preview.direction} · confidence {(preview.confidence * 100).toFixed(0)}% · lag {preview.lagWeeks}w
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-[#93a9c8]">No direct relationships found for this entity.</p>
                  )}
                  {previewQuery.isError && (
                    <p className="mt-2 text-xs text-[#f0a6a6]">Using local relationship graph fallback.</p>
                  )}
                </div>
              )}
            </ul>
          ) : (
            <p className="text-sm text-[#9ab0cd]">No entities found for this query.</p>
          )}

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={activeResults.page <= 1 || searchQuery.isFetching}
              className="rounded border border-[#2f4564] bg-[#122136] px-3 py-1.5 text-xs text-[#dce8f9] hover:bg-[#1b3150] disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(activeResults.totalPages, prev + 1))}
              disabled={activeResults.page >= activeResults.totalPages || searchQuery.isFetching}
              className="rounded border border-[#2f4564] bg-[#122136] px-3 py-1.5 text-xs text-[#dce8f9] hover:bg-[#1b3150] disabled:opacity-50"
            >
              Next
            </button>
          </div>

          {searchQuery.isError && (
            <p className="mt-3 text-xs text-[#f0a6a6]">Search API unavailable. Displaying local fallback results.</p>
          )}
        </div>
      )}
    </div>
  )
}
