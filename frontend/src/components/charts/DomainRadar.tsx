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
    <div className="rounded-xl border border-[#e0dcd4] bg-white p-4">
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={domainData}>
          <PolarGrid stroke="#e0dcd4" />
          <PolarAngleAxis dataKey="domain" stroke="#6a6374" />
          <PolarRadiusAxis angle={90} domain={[0, 10]} stroke="#6a6374" />
          <Radar name="Risk Level" dataKey="risk" stroke="#ef233c" fill="#ef233c" fillOpacity={0.3} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
