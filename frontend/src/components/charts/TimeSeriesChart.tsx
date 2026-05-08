import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { timelineSeries } from '../../lib/mockData'

export default function TimeSeriesChart() {
  return (
    <div className="rounded-xl border border-[#e0dcd4] bg-white p-4">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={timelineSeries}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0dcd4" />
          <XAxis dataKey="month" stroke="#6a6374" />
          <YAxis stroke="#6a6374" />
          <Tooltip contentStyle={{ backgroundColor: '#fbfaf8' }} />
          <Line type="monotone" dataKey="rainfall" stroke="#00b4d8" dot={false} />
          <Line type="monotone" dataKey="dengue" stroke="#ef233c" dot={false} />
          <Line type="monotone" dataKey="foodPrice" stroke="#f4a261" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
