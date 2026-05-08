import ConfidenceBadge from '../ui/ConfidenceBadge'
import DomainBadge from '../ui/DomainBadge'
import { useGraph } from '../../hooks/useGraph'
import { useGraphStore } from '../../store/graphStore'

export default function NodePanel() {
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId)
  const { nodes, edges, isLoading } = useGraph()
  const node = nodes.find((item) => item.id === selectedNodeId)
  const edge = edges.find((item) => item.source === selectedNodeId)

  if (isLoading && !node) {
    return (
      <div className="rounded-2xl border border-[#1f2a3b] bg-[#0f1724]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">Node Detail</p>
        <p className="mt-4 text-sm text-[#91a5c2]">Loading node details...</p>
      </div>
    )
  }

  if (!node) {
    return (
      <div className="rounded-2xl border border-[#1f2a3b] bg-[#0f1724]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">Node Detail</p>
        <p className="mt-4 text-sm text-[#91a5c2]">Select a node to inspect details.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[#1f2a3b] bg-[#0f1724]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">Node Detail</p>
          <h3 className="text-lg font-semibold text-[#f3f7ff]">{node.label}</h3>
        </div>
        <DomainBadge label={node.domain} />
      </div>
      <div className="mt-4 space-y-2 text-sm text-[#c6d7ec]">
        <p>Type: {node.entityType}</p>
        <p>Severity: {node.severity.toFixed(1)} / 10</p>
        <p>
          Valid: {node.validFrom}
          {node.validTo ? ` to ${node.validTo}` : ''}
        </p>
        <p>Source: {node.source}</p>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <ConfidenceBadge value={edge?.confidence ?? 0.6} />
        <span className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">
          {node.domain} domain
        </span>
      </div>
    </div>
  )
}
