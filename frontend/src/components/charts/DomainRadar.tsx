import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'

const domainData = [
  { domain: 'Climate', risk: 7.5 },
  { domain: 'Disease', risk: 7.9 },
  { domain: 'Economy', risk: 6.8 },
  { domain: 'Ecology', risk: 8.1 },
  { domain: 'Population', risk: 5.9 },
  { domain: 'Infrastructure', risk: 6.4 },
]

export default function DomainRadar() {
  return (
    <div className="rounded-xl border border-[#1f2a3b] bg-[#0d1828] p-4">
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={domainData}>
          <PolarGrid stroke="#27364d" />
          <PolarAngleAxis dataKey="domain" stroke="#8ea3c1" />
          <PolarRadiusAxis angle={90} domain={[0, 10]} stroke="#8ea3c1" />
          <Radar name="Risk Level" dataKey="risk" stroke="#ff7272" fill="#ff7272" fillOpacity={0.3} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
