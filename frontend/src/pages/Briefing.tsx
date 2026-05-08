import { useState } from 'react'
import IntelligenceBriefing from '../components/ui/IntelligenceBriefing'
import DomainBadge from '../components/ui/DomainBadge'
import { graphNodes } from '../lib/mockData'
import { useGraphStore } from '../store/graphStore'

export default function Briefing() {
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId)
  const setSelectedNodeId = useGraphStore((state) => state.setSelectedNodeId)
  const [pendingId, setPendingId] = useState(selectedNodeId ?? graphNodes[0]?.id)
  const [committedId, setCommittedId] = useState(selectedNodeId ?? graphNodes[0]?.id)
  const [domainFilter, setDomainFilter] = useState('all')

  const domains = ['all', ...Array.from(new Set(graphNodes.map((n) => n.domain)))]

  const filtered = graphNodes.filter(
    (n) => domainFilter === 'all' || n.domain === domainFilter,
  )

  const activeNode = graphNodes.find((n) => n.id === committedId)

  function generate() {
    if (!pendingId) return
    setCommittedId(pendingId)
    setSelectedNodeId(pendingId)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">AI Intelligence Briefing</p>
        <h2 className="text-2xl font-semibold text-[#f3f7ff]">Structured intelligence output</h2>
        <p className="mt-1 text-sm text-[#91a5c2]">
          Select a node below and generate a structured briefing powered by the Groq LLaMA 3.3 70B model.
        </p>
      </div>
      <section className="rounded-2xl border border-[#1f2a3b] bg-[#0f1724]/95 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">Node Selector</p>
            <p className="mt-1 text-sm text-[#c6d7ec]">Choose an entity to generate a briefing for</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-[#7f93b1]">Filter:</p>
            {domains.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDomainFilter(d)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  domainFilter === d
                    ? 'bg-[#193254] text-[#eaf2ff] border border-[#4e79ab]'
                    : 'border border-[#1f2a3b] text-[#91a5c2] hover:border-[#2f4564]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((node) => (
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
                <p className="text-sm font-medium text-[#dce8f9]">{node.label}</p>
                <p className="mt-1 text-xs text-[#7090b0]">
                  {node.entityType} · severity {node.severity.toFixed(1)}
                </p>
                <div className="mt-2">
                  <DomainBadge label={node.domain} />
                </div>
              </button>
            </li>
          ))}
        </ul>
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
