import { useMutation } from '@tanstack/react-query'
import { apiClient } from '../../lib/api'
import { graphNodes } from '../../lib/mockData'
import { useGraphStore } from '../../store/graphStore'

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function extractFirstNodeId(payload: unknown): string | null {
  const top = asRecord(payload)
  if (!top) {
    return null
  }

  const nested = asRecord(top.data)
  const source =
    (Array.isArray(top.nodes) ? top.nodes : undefined) ??
    (Array.isArray(top.results) ? top.results : undefined) ??
    (Array.isArray(top.items) ? top.items : undefined) ??
    (Array.isArray(nested?.nodes) ? nested.nodes : undefined) ??
    (Array.isArray(nested?.results) ? nested.results : undefined)

  if (!source?.length) {
    return null
  }

  const first = asRecord(source[0])
  const id = first && typeof first.id === 'string' ? first.id : null
  return id
}

export default function ConceptSearch() {
  const searchTerm = useGraphStore((state) => state.searchTerm)
  const setSearchTerm = useGraphStore((state) => state.setSearchTerm)
  const setSelectedNodeId = useGraphStore((state) => state.setSelectedNodeId)
  const setSelectedEdgeId = useGraphStore((state) => state.setSelectedEdgeId)

  const searchMutation = useMutation({
    mutationFn: async (term: string) => {
      const currentDate = useGraphStore((s) => s.currentDate)
      const payload = await apiClient(`/api/search?q=${encodeURIComponent(term)}&date=${encodeURIComponent(currentDate)}`)
      return extractFirstNodeId(payload)
    },
    onSuccess: (nodeId) => {
      if (nodeId) {
        setSelectedNodeId(nodeId)
        setSelectedEdgeId(undefined)
        return
      }

      const fallbackMatch = graphNodes.find((node) =>
        node.label.toLowerCase().includes(searchTerm.trim().toLowerCase()),
      )
      if (fallbackMatch) {
        setSelectedNodeId(fallbackMatch.id)
        setSelectedEdgeId(undefined)
      }
    },
  })

  const onExplore = () => {
    const term = searchTerm.trim()
    if (!term) {
      return
    }

    searchMutation.mutate(term)
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#24344a] bg-[#0d1828] px-4 py-3">
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
        disabled={searchMutation.isPending}
        className="rounded-full border border-[#2f4564] bg-[#193254] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#eaf2ff] hover:bg-[#23456f]"
      >
        {searchMutation.isPending ? 'Exploring...' : 'Explore'}
      </button>
      {searchMutation.isError && (
        <p className="w-full text-xs text-[#f0a6a6]">Search API unavailable. Using local fallback where possible.</p>
      )}
    </div>
  )
}
