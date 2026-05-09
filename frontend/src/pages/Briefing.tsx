import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import IntelligenceBriefing from '../components/ui/IntelligenceBriefing'
import DomainBadge from '../components/ui/DomainBadge'
import { useGraphStore } from '../store/graphStore'
import { apiClient } from '../lib/api'
import type { GraphNode } from '../lib/mockData'

const DOMAINS = ['all', 'climate', 'disease', 'economy', 'ecology', 'population', 'infrastructure', 'agriculture', 'social']

export default function Briefing() {
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId)
  const setSelectedNodeId = useGraphStore((state) => state.setSelectedNodeId)
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [domainFilter, setDomainFilter] = useState('all')
  const [pendingId, setPendingId] = useState(selectedNodeId ?? '')
  const [committedId, setCommittedId] = useState(selectedNodeId ?? '')

  const { data: results = [], isFetching } = useQuery<GraphNode[]>({
    queryKey: ['briefing-search', searchTerm, domainFilter],
    enabled: searchTerm.length >= 2 || domainFilter !== 'all',
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '30' })
      if (searchTerm.length >= 2) params.set('q', searchTerm)
      else params.set('q', domainFilter !== 'all' ? domainFilter : 'event')
      if (domainFilter !== 'all') params.set('domain', domainFilter)
      const data = await apiClient(`/api/search?${params}`)
      return Array.isArray(data) ? data : []
    },
    staleTime: 30_000,
  })

  const activeNode = results.find((n) => n.id === committedId)

  function generate() {
    if (!pendingId) return
    setCommittedId(pendingId)
    setSelectedNodeId(pendingId)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearchTerm(searchInput.trim())
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">AI Intelligence Briefing</p>
        <h2 className="text-2xl font-semibold text-[#f3f7ff]">Structured intelligence output</h2>
        <p className="mt-1 text-sm text-[#91a5c2]">
          Search for any real entity from the graph, select it, then generate a structured briefing powered by Groq LLaMA 3.3 70B.
        </p>
      </div>
      <section className="rounded-2xl border border-[#1f2a3b] bg-[#0f1724]/95 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
        <div className="flex flex-wrap items-end gap-3">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <input
              id="briefing-search"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search entities — dengue, rainfall, conflict…"
              className="flex-1 rounded-xl border border-[#1f2a3b] bg-[#0a1220] px-4 py-2.5 text-sm text-[#e6edf7] placeholder:text-[#4a6a8a] focus:border-[#4db8ff] focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#193254] px-5 py-2.5 text-sm font-semibold text-[#eaf2ff] hover:bg-[#22426a]"
            >
              Search
            </button>
          </form>
          <div className="flex flex-wrap gap-1.5">
            {DOMAINS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDomainFilter(d)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  domainFilter === d
                    ? 'border border-[#4e79ab] bg-[#193254] text-[#eaf2ff]'
                    : 'border border-[#1f2a3b] text-[#91a5c2] hover:border-[#2f4564]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        {isFetching && (
          <p className="mt-3 text-xs text-[#4db8ff]">Searching real data…</p>
        )}
        {results.length > 0 && (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((node) => (
              <li key={node.id}>
                <button
                  type="button"
                  onClick={() => setPendingId(node.id)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${
                    pendingId === node.id
                      ? 'border-[#4e79ab] bg-[#17304d]'
                      : 'border-[#1f2a3b] bg-[#0a1420] hover:border-[#2f4564] hover:bg-[#111e30]'
                  }`}
                >
                  <p className="truncate text-sm font-medium text-[#dce8f9]">{node.label}</p>
                  <p className="mt-1 text-xs text-[#7090b0]">
                    {node.entityType} · severity {Number(node.severity).toFixed(1)}
                  </p>
                  <div className="mt-2">
                    <DomainBadge label={node.domain} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {!isFetching && searchTerm.length >= 2 && results.length === 0 && (
          <p className="mt-4 text-sm text-[#5a7090]">No entities found for "{searchTerm}" — try ingesting data first via the backend ETL.</p>
        )}
        {!searchTerm && domainFilter === 'all' && (
          <p className="mt-4 text-sm text-[#5a7090]">Search above or select a domain to browse real ingested entities.</p>
        )}
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={generate}
            disabled={!pendingId}
            className="rounded-full border border-[#2f4564] bg-[#193254] px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-[#eaf2ff] hover:bg-[#23456f] disabled:opacity-50"
          >
            Generate Briefing
          </button>
          {activeNode && (
            <p className="text-xs text-[#7f93b1]">
              Showing: <span className="text-[#c6d7ec]">{activeNode.label}</span>
            </p>
          )}
        </div>
      </section>
      <IntelligenceBriefing />
    </div>
  )
}
