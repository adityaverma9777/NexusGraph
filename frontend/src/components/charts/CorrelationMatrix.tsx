import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useGraph } from '../../hooks/useGraph'

const RELATIONSHIP_COLORS: Record<string, string> = {
  DRIVES: '#ffffff',
  AMPLIFIES: '#f4a261',
  TRIGGERS: '#ef233c',
  STRESSES: '#c77dff',
  REDUCES: '#52b788',
  CORRELATES_WITH: '#a8dadc',
  PRECEDES: '#7fc8f8',
}

export default function CorrelationMatrix() {
  const { edges } = useGraph()

  const data = edges
    .map((edge) => ({
      name: edge.relationship,
      confidence: Number(edge.confidence.toFixed(2)),
      label: `${edge.relationship}`,
      lagWeeks: edge.lagWeeks,
    }))
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, 8)

  return (
    <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-4">
      <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#aaaaaa]">
        Edge Confidence | {edges.length} active relationships
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#111111" horizontal={false} />
          <XAxis type="number" domain={[0, 1]} stroke="#8ea3c1" tick={{ fontSize: 10 }} />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#8ea3c1"
            tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono' }}
            width={80}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #2d3d54', color: '#f0f0f0', fontSize: 12 }}
            formatter={(value) => {
              const numeric = typeof value === 'number' ? value : Number(value ?? 0)
              return [`${(numeric * 100).toFixed(0)}%`, 'Confidence']
            }}
          />
          <Bar dataKey="confidence" radius={[0, 3, 3, 0]}>
            {data.map((entry, index) => (
              <Cell key={`${entry.name}-${entry.lagWeeks}-${index}`} fill={RELATIONSHIP_COLORS[entry.name] ?? '#6da4ff'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
