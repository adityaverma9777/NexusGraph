import ConfidenceBadge from '../ui/ConfidenceBadge'
import { graphEdges, graphNodes } from '../../lib/mockData'
import { useGraphStore } from '../../store/graphStore'

export default function EdgePanel() {
  const selectedEdgeId = useGraphStore((state) => state.selectedEdgeId)
  const edge = graphEdges.find((item) => item.id === selectedEdgeId)
  const sourceNode = edge ? graphNodes.find((n) => n.id === edge.source) : undefined
  const targetNode = edge ? graphNodes.find((n) => n.id === edge.target) : undefined

  if (!edge || !sourceNode || !targetNode) {
    return (
      <div className="rounded-2xl border border-[#e0dcd4] bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-[#6a6374]">Relationship</p>
        <p className="mt-4 text-sm text-[#6a6374]">Select a relationship to inspect details.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[#e0dcd4] bg-white p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-[#6a6374]">Relationship</p>
      <h3 className="mt-1 text-lg font-semibold">
        {edge.relationship}: {targetNode.label}
      </h3>
      <p className="mt-2 text-xs text-[#6a6374]">
        From: <span className="font-semibold">{sourceNode.label}</span>
      </p>
      <div className="mt-4 space-y-2 text-sm text-[#4d4852]">
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
