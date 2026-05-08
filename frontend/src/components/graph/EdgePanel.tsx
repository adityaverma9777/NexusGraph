import ConfidenceBadge from '../ui/ConfidenceBadge'
import { useGraph } from '../../hooks/useGraph'
import { useGraphStore } from '../../store/graphStore'

export default function EdgePanel() {
  const selectedEdgeId = useGraphStore((state) => state.selectedEdgeId)
  const { nodes, edges, isLoading } = useGraph()
  const edge = edges.find((item) => item.id === selectedEdgeId)
  const sourceNode = edge ? nodes.find((n) => n.id === edge.source) : undefined
  const targetNode = edge ? nodes.find((n) => n.id === edge.target) : undefined

  if (isLoading && !edge) {
    return (
      <div className="rounded-2xl border border-[#1f2a3b] bg-[#0f1724]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">Relationship</p>
        <p className="mt-4 text-sm text-[#91a5c2]">Loading relationship details...</p>
      </div>
    )
  }

  if (!edge || !sourceNode || !targetNode) {
    return (
      <div className="rounded-2xl border border-[#1f2a3b] bg-[#0f1724]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">Relationship</p>
        <p className="mt-4 text-sm text-[#91a5c2]">Select a relationship to inspect details.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[#1f2a3b] bg-[#0f1724]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
      <p className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">Relationship</p>
      <h3 className="mt-1 text-lg font-semibold text-[#f3f7ff]">
        {edge.relationship}: {targetNode.label}
      </h3>
      <p className="mt-2 text-xs text-[#91a5c2]">
        From: <span className="font-semibold">{sourceNode.label}</span>
      </p>
      <div className="mt-4 space-y-2 text-sm text-[#c6d7ec]">
        <p>Lag: {edge.lagWeeks} weeks</p>
        <p>Evidence: {edge.evidenceType}</p>
        <p>Source: {edge.sourceDataset}</p>
      </div>
      <div className="mt-5">
        <ConfidenceBadge value={edge.confidence} />
      </div>
    </div>
  )
}
