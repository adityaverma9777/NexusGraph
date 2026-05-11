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
  const selectedEdgeId = useGraphStore((state) => state.selectedEdgeId)
  const setCascadeType = useGraphStore((state) => state.setCascadeType)
  const setSearchQuery = useGraphStore((state) => state.setSearchQuery)
  const clearPath = useGraphStore((state) => state.clearPath)
  const { nodes, edges, isLoading } = useGraph()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)

  const node = nodes.find((item) => item.id === selectedNodeId) ?? nodes.find((item) => item.domain !== 'meta') ?? nodes[0]
  const activeNodeId = node?.id
  const selectedEdge = edges.find((item) => item.id === selectedEdgeId)
  const cascadeNode = selectedEdge
    ? nodes.find((item) => item.id === selectedEdge.source) ?? nodes.find((item) => item.id === selectedEdge.target)
    : node
  const outboundEdges = edges.filter((edge) => edge.source === activeNodeId)
  const inboundEdges = edges.filter((edge) => edge.target === activeNodeId)
  const nodeColor = node ? domainColors[node.domain as Domain] : '#ffffff'

  if (isLoading && !node) {
    return <CardSkeleton lines={4} />
  }

  if (!node) {
    return (
      <div className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[#aaaaaa]">Node Detail</p>
        <p className="mt-4 text-sm text-[#bbbbbb]">Select a node on the graph to inspect its details.</p>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl border bg-[#0a0a0a]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
      style={{ borderColor: nodeColor + '44' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
            style={{ backgroundColor: nodeColor, boxShadow: `0 0 8px ${nodeColor}88` }}
          />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#aaaaaa]">Node Detail</p>
            <h3 className="text-lg font-semibold text-[#ffffff]">{node.label}</h3>
          </div>
        </div>
        <DomainBadge label={node.domain} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-[#dddddd]">
        <div>
          <span className="text-xs text-[#999999]">Type</span>
          <p className="mt-0.5 text-xs font-medium text-[#dddddd]">{node.entityType}</p>
        </div>
        <div>
          <span className="text-xs text-[#999999]">Severity</span>
          <p
            className="mt-0.5 text-xs font-bold"
            style={{ color: node.severity > 7 ? '#ef233c' : node.severity > 5 ? '#f4a261' : '#52b788' }}
          >
            {node.severity.toFixed(1)} / 10
          </p>
        </div>
        <div>
          <span className="text-xs text-[#999999]">Valid From</span>
          <p className="mt-0.5 text-xs text-[#dddddd]">{node.validFrom}</p>
        </div>
        <div>
          <span className="text-xs text-[#999999]">Source</span>
          <p className="mt-0.5 text-xs text-[#dddddd]">{node.source}</p>
        </div>
      </div>
      {node.properties && Object.keys(node.properties).length > 0 && (
        <div className="mt-4 space-y-1.5 rounded-lg border border-[#111111] bg-[#111111] p-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#999999]">Properties</p>
          {Object.entries(node.properties).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between text-xs">
              <span className="text-[#7090b0]">{PROPERTY_LABELS[key] ?? key}</span>
              <span className="font-semibold text-[#ffffff]">{String(value)}</span>
            </div>
          ))}
        </div>
      )}
      {(outboundEdges.length > 0 || inboundEdges.length > 0) && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setExpanded((previous) => !previous)}
            className="text-xs text-[#aaaaaa] hover:text-[#dddddd]"
          >
            {expanded ? 'v' : '>'} {outboundEdges.length + inboundEdges.length} relationship
            {outboundEdges.length + inboundEdges.length !== 1 ? 's' : ''}
          </button>
          {expanded && (
            <ul className="mt-2 space-y-1.5">
              {outboundEdges.map((edge) => {
                const peer = nodes.find((item) => item.id === edge.target)
                return (
                  <li key={edge.id} className="flex items-center gap-2 text-xs">
                    <span className="text-[#ffffff]">-&gt;</span>
                    <span className="font-mono text-[#c77dff]">{edge.relationship}</span>
                    <span className="text-[#dddddd]">{peer?.label ?? edge.target}</span>
                    <span className="ml-auto text-[#999999]">{(edge.confidence * 100).toFixed(0)}%</span>
                  </li>
                )
              })}
              {inboundEdges.map((edge) => {
                const peer = nodes.find((item) => item.id === edge.source)
                return (
                  <li key={edge.id} className="flex items-center gap-2 text-xs">
                    <span className="text-[#52b788]">&lt;-</span>
                    <span className="font-mono text-[#f4a261]">{edge.relationship}</span>
                    <span className="text-[#dddddd]">{peer?.label ?? edge.source}</span>
                    <span className="ml-auto text-[#999999]">{(edge.confidence * 100).toFixed(0)}%</span>
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
          onClick={() => {
            clearPath()
            setSearchQuery('')
            setCascadeType(cascadeNode?.entityType ?? node.entityType)
          }}
          className="rounded-full border border-[#222222] bg-[#0a0a0a] px-3 py-1 text-xs text-[#dddddd] hover:bg-[#222222]"
        >
          Run cascade
        </button>
        <button
          type="button"
          onClick={() => navigate('/briefing')}
          className="rounded-full border border-[#222222] bg-[#222222] px-3 py-1 text-xs font-semibold text-[#ffffff] hover:bg-[#333333]"
        >
          {'Generate briefing ->'}
        </button>
      </div>
    </div>
  )
}
