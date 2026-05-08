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
      <div className="rounded-2xl border border-[#e0dcd4] bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-[#6a6374]">Node Detail</p>
        <p className="mt-4 text-sm text-[#6a6374]">Loading node details...</p>
      </div>
    )
  }

  if (!node) {
    return (
      <div className="rounded-2xl border border-[#e0dcd4] bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-[#6a6374]">Node Detail</p>
        <p className="mt-4 text-sm text-[#6a6374]">Select a node to inspect details.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[#e0dcd4] bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#6a6374]">Node Detail</p>
          <h3 className="text-lg font-semibold">{node.label}</h3>
        </div>
        <DomainBadge label={node.domain} />
      </div>
      <div className="mt-4 space-y-2 text-sm text-[#4d4852]">
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
        <span className="text-xs uppercase tracking-[0.3em] text-[#6a6374]">
          {node.domain} domain
        </span>
      </div>
    </div>
  )
}
