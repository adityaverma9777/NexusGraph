import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
import { useGraph } from '../../hooks/useGraph'

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
  const realNodes = nodes.filter((node) => node.domain !== 'meta' && node.domain !== 'unknown')

  const domainAvgSeverity = DOMAIN_ORDER.map((domainLabel) => {
    const domainKey = domainLabel.toLowerCase()
    const domainNodes = realNodes.filter((node) => node.domain === domainKey)
    const risk = domainNodes.length
      ? domainNodes.reduce((sum, node) => sum + node.severity, 0) / domainNodes.length
      : 0
    return { domain: DOMAIN_KEY_MAP[domainKey] ?? domainLabel, risk: Number(risk.toFixed(1)), count: domainNodes.length }
  })

  return (
    <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-4">
      <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-[#aaaaaa]">
        Domain Risk Radar | {realNodes.length} live nodes
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={domainAvgSeverity}>
          <PolarGrid stroke="#111111" />
          <PolarAngleAxis dataKey="domain" stroke="#8ea3c1" tick={{ fontSize: 10 }} />
          <PolarRadiusAxis angle={90} domain={[0, 10]} stroke="#2a3d57" tick={{ fontSize: 9 }} />
          <Radar name="Risk Level" dataKey="risk" stroke="#ffffff" fill="#ffffff" fillOpacity={0.25} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #2d3d54', color: '#f0f0f0', fontSize: 12 }}
            formatter={(value) => {
              const numeric = typeof value === 'number' ? value : Number(value ?? 0)
              return [numeric.toFixed(1), 'Avg Severity']
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
