import { useGraph } from '../../hooks/useGraph'
import { useGraphStore } from '../../store/graphStore'

export default function RiskGauge() {
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId)
  const { nodes } = useGraph()

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)
  const riskLevel = selectedNode
    ? selectedNode.severity
    : nodes.length
      ? nodes.reduce((sum, n) => sum + n.severity, 0) / nodes.length
      : 7.2

  const riskColor = riskLevel > 7 ? '#ef233c' : riskLevel > 5 ? '#f4a261' : '#52b788'
  const riskLabel = riskLevel > 7 ? 'High' : riskLevel > 5 ? 'Medium' : 'Low'

  const circumference = 2 * Math.PI * 45
  const dashOffset = circumference * (1 - riskLevel / 10)

  return (
    <div className="rounded-xl border border-[#1f2a3b] bg-[#0d1828] p-6 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-[#8ea3c1]">
        {selectedNode ? selectedNode.label : 'System Risk Level'}
      </p>
      <div className="relative mx-auto mt-2 h-32 w-32">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#1a2a3d" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={riskColor}
            strokeWidth="8"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${riskColor}88)`, transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color: riskColor }}>
            {riskLevel.toFixed(1)}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-[#7090b0]">/10</span>
        </div>
      </div>
      <p className="mt-2 text-sm font-semibold" style={{ color: riskColor }}>{riskLabel} Risk</p>
      {!selectedNode && nodes.length > 0 && (
        <p className="mt-1 text-[10px] text-[#5a7090]">avg. across {nodes.length} nodes</p>
      )}
    </div>
  )
}
