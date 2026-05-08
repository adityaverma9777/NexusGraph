import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
import { useGraph } from '../../hooks/useGraph'
import { graphNodes } from '../../lib/mockData'

const DOMAIN_ORDER = ['Climate', 'Disease', 'Economy', 'Ecology', 'Population', 'Infrastructure']

const DOMAIN_KEY_MAP: Record<string, string> = {
  climate: 'Climate',
  disease: 'Disease',
  economy: 'Economy',
  ecology: 'Ecology',
  population: 'Population',
  infrastructure: 'Infrastructure',
}

export default function DomainRadar() {
  const { nodes } = useGraph()
  const activeNodes = nodes.length ? nodes : graphNodes

  const domainAvgSeverity = DOMAIN_ORDER.map((domainLabel) => {
    const domainKey = domainLabel.toLowerCase()
    const domainNodes = activeNodes.filter((n) => n.domain === domainKey)
    const risk = domainNodes.length
      ? domainNodes.reduce((sum, n) => sum + n.severity, 0) / domainNodes.length
      : 0
    return { domain: DOMAIN_KEY_MAP[domainKey] ?? domainLabel, risk: Number(risk.toFixed(1)), count: domainNodes.length }
  })

  return (
    <div className="rounded-xl border border-[#1f2a3b] bg-[#0d1828] p-4">
      <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-[#7f93b1]">
        Domain Risk Radar · {activeNodes.length} nodes
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={domainAvgSeverity}>
          <PolarGrid stroke="#1a2a3d" />
          <PolarAngleAxis dataKey="domain" stroke="#8ea3c1" tick={{ fontSize: 10 }} />
          <PolarRadiusAxis angle={90} domain={[0, 10]} stroke="#2a3d57" tick={{ fontSize: 9 }} />
          <Radar name="Risk Level" dataKey="risk" stroke="#4db8ff" fill="#4db8ff" fillOpacity={0.25} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0d1828', border: '1px solid #2d3d54', color: '#e6edf7', fontSize: 12 }}
            formatter={(val: number) => [val.toFixed(1), 'Avg Severity']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
