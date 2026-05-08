import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const correlationData = [
  { name: 'Rainfall→Disease', correlation: 0.75 },
  { name: 'Disease→Healthcare', correlation: 0.62 },
  { name: 'Price→Migration', correlation: 0.58 },
  { name: 'Deforest→Zoonotic', correlation: 0.66 },
]

export default function CorrelationMatrix() {
  return (
    <div className="rounded-xl border border-[#1f2a3b] bg-[#0d1828] p-4">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={correlationData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27364d" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} stroke="#8ea3c1" />
          <YAxis domain={[0, 1]} stroke="#8ea3c1" />
          <Tooltip contentStyle={{ backgroundColor: '#122136', border: '1px solid #2d3d54', color: '#e6edf7' }} />
          <Bar dataKey="correlation" fill="#6da4ff" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
