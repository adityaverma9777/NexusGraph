import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { apiClient } from '../../lib/api'
import { graphNodes } from '../../lib/mockData'
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

export default function ConceptSearch() {
  const searchTerm = useGraphStore((state) => state.searchTerm)
  const setSearchTerm = useGraphStore((state) => state.setSearchTerm)
  const currentDate = useGraphStore((state) => state.currentDate)
  const setSelectedNodeId = useGraphStore((state) => state.setSelectedNodeId)
  const setSelectedEdgeId = useGraphStore((state) => state.setSelectedEdgeId)

  const [submittedTerm, setSubmittedTerm] = useState('')
  const [page, setPage] = useState(1)

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
  }

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
                    className="w-full rounded-md border border-[#2b3e58] bg-[#122136] px-3 py-2 text-left hover:border-[#406188] hover:bg-[#162943]"
                  >
                    <p className="text-sm font-medium text-[#e9f2ff]">{result.label}</p>
                    <p className="mt-1 text-xs text-[#9ab0cd]">
                      {result.domain} · {result.entityType} · severity {result.severity.toFixed(1)} · {result.source}
                    </p>
                  </button>
                </li>
              ))}
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
