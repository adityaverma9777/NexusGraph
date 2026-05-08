import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const correlationData = [
  { name: 'Rainfall→Disease', correlation: 0.75 },
  { name: 'Disease→Healthcare', correlation: 0.62 },
  { name: 'Price→Migration', correlation: 0.58 },
  { name: 'Deforest→Zoonotic', correlation: 0.66 },
]

export default function CorrelationMatrix() {
  return (
    <div className="rounded-xl border border-[#e0dcd4] bg-white p-4">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={correlationData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0dcd4" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} stroke="#6a6374" />
          <YAxis domain={[0, 1]} stroke="#6a6374" />
          <Tooltip contentStyle={{ backgroundColor: '#fbfaf8' }} />
          <Bar dataKey="correlation" fill="#5b5561" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
