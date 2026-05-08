import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfidenceBadge from '../ui/ConfidenceBadge'
import DomainBadge from '../ui/DomainBadge'
import { CardSkeleton } from '../ui/Skeleton'
import { useGraph } from '../../hooks/useGraph'
import { useGraphStore } from '../../store/graphStore'
import { domainColors } from '../../lib/mockData'
import type { Domain } from '../../lib/mockData'

const PROPERTY_LABELS: Record<string, string> = {
  anomaly_pct: 'Anomaly %',
  breeding_index: 'Breeding Index',
  cases: 'Case Count',
  area_ha: 'Area (ha)',
  price_index_change: 'Price Change %',
  persons_affected: 'Persons Affected',
}

export default function NodePanel() {
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId)
  const setCascadeType = useGraphStore((state) => state.setCascadeType)
  const { nodes, edges, isLoading } = useGraph()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)

  const node = nodes.find((item) => item.id === selectedNodeId)
  const outboundEdges = edges.filter((e) => e.source === selectedNodeId)
  const inboundEdges = edges.filter((e) => e.target === selectedNodeId)
  const nodeColor = node ? domainColors[node.domain as Domain] : '#4db8ff'

  if (isLoading && !node) {
    return <CardSkeleton lines={4} />
  }

  if (!node) {
    return (
      <div className="rounded-2xl border border-[#1f2a3b] bg-[#0f1724]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">Node Detail</p>
        <p className="mt-4 text-sm text-[#91a5c2]">Select a node on the graph to inspect its details.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border bg-[#0f1724]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
      style={{ borderColor: nodeColor + '44' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
            style={{ backgroundColor: nodeColor, boxShadow: `0 0 8px ${nodeColor}88` }}
          />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">Node Detail</p>
            <h3 className="text-lg font-semibold text-[#f3f7ff]">{node.label}</h3>
          </div>
        </div>
        <DomainBadge label={node.domain} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-[#c6d7ec]">
        <div>
          <span className="text-xs text-[#5a7090]">Type</span>
          <p className="mt-0.5 text-xs font-medium text-[#dce8f9]">{node.entityType}</p>
        </div>
        <div>
          <span className="text-xs text-[#5a7090]">Severity</span>
          <p className="mt-0.5 text-xs font-bold" style={{ color: node.severity > 7 ? '#ef233c' : node.severity > 5 ? '#f4a261' : '#52b788' }}>
            {node.severity.toFixed(1)} / 10
          </p>
        </div>
        <div>
          <span className="text-xs text-[#5a7090]">Valid From</span>
          <p className="mt-0.5 text-xs text-[#dce8f9]">{node.validFrom}</p>
        </div>
        <div>
          <span className="text-xs text-[#5a7090]">Source</span>
          <p className="mt-0.5 text-xs text-[#dce8f9]">{node.source}</p>
        </div>
      </div>
      {node.properties && Object.keys(node.properties).length > 0 && (
        <div className="mt-4 space-y-1.5 rounded-lg border border-[#1a2a3d] bg-[#0a1422] p-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#5a7090]">Properties</p>
          {Object.entries(node.properties).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between text-xs">
              <span className="text-[#7090b0]">{PROPERTY_LABELS[key] ?? key}</span>
              <span className="font-semibold text-[#eaf2ff]">{String(val)}</span>
            </div>
          ))}
        </div>
      )}
      {(outboundEdges.length > 0 || inboundEdges.length > 0) && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="text-xs text-[#7f93b1] hover:text-[#c6d7ec]"
          >
            {expanded ? '▾' : '▸'} {outboundEdges.length + inboundEdges.length} relationship{outboundEdges.length + inboundEdges.length !== 1 ? 's' : ''}
          </button>
          {expanded && (
            <ul className="mt-2 space-y-1.5">
              {outboundEdges.map((e) => {
                const peer = nodes.find((n) => n.id === e.target)
                return (
                  <li key={e.id} className="flex items-center gap-2 text-xs">
                    <span className="text-[#4db8ff]">→</span>
                    <span className="font-mono text-[#c77dff]">{e.relationship}</span>
                    <span className="text-[#c6d7ec]">{peer?.label ?? e.target}</span>
                    <span className="ml-auto text-[#5a7090]">{(e.confidence * 100).toFixed(0)}%</span>
                  </li>
                )
              })}
              {inboundEdges.map((e) => {
                const peer = nodes.find((n) => n.id === e.source)
                return (
                  <li key={e.id} className="flex items-center gap-2 text-xs">
                    <span className="text-[#52b788]">←</span>
                    <span className="font-mono text-[#f4a261]">{e.relationship}</span>
                    <span className="text-[#c6d7ec]">{peer?.label ?? e.source}</span>
                    <span className="ml-auto text-[#5a7090]">{(e.confidence * 100).toFixed(0)}%</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <ConfidenceBadge value={outboundEdges[0]?.confidence ?? 0.6} />
        <button
          type="button"
          onClick={() => setCascadeType(node.entityType)}
          className="rounded-full border border-[#2b3a52] bg-[#0f1b2d] px-3 py-1 text-xs text-[#c5d4ea] hover:bg-[#16253a]"
        >
          Run cascade
        </button>
        <button
          type="button"
          onClick={() => navigate('/briefing')}
          className="rounded-full border border-[#2f4564] bg-[#193254] px-3 py-1 text-xs font-semibold text-[#eaf2ff] hover:bg-[#23456f]"
        >
          Generate briefing →
        </button>
      </div>
    </div>
  )
}
