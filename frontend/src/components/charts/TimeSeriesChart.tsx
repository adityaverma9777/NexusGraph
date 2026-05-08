import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { apiClient } from '../../lib/api'
import { useGraphStore } from '../../store/graphStore'
import { timelineSeries } from '../../lib/mockData'

type SeriesRow = {
  month: string
  rainfall: number
  dengue: number
  foodPrice: number
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function toSeriesRow(input: unknown): SeriesRow | null {
  const record = asRecord(input)
  if (!record) {
    return null
  }

  const month =
    typeof record.month === 'string'
      ? record.month
      : typeof record.date === 'string'
        ? record.date.slice(0, 7)
        : undefined
  if (!month) {
    return null
  }

  return {
    month,
    rainfall: toNumber(record.rainfall ?? record.precipitation ?? record.value),
    dengue: toNumber(record.dengue ?? record.cases),
    foodPrice: toNumber(record.foodPrice ?? record.food_price ?? record.price_index),
  }
}

function normalizeSeries(payload: unknown): SeriesRow[] | null {
  const top = asRecord(payload)
  if (!top) {
    return null
  }

  const nested = asRecord(top.data)
  const source =
    (Array.isArray(top.series) ? top.series : undefined) ??
    (Array.isArray(top.points) ? top.points : undefined) ??
    (Array.isArray(nested?.series) ? nested.series : undefined)

  if (!source) {
    return null
  }

  const rows = source.map((item) => toSeriesRow(item)).filter((item): item is SeriesRow => Boolean(item))
  return rows.length ? rows : null
}

export default function TimeSeriesChart() {
  const currentDate = useGraphStore((s) => s.currentDate)

  const query = useQuery({
    queryKey: ['metrics-timeseries-demo', currentDate],
    queryFn: async () => {
      const payload = await apiClient(
        `/api/metrics/timeseries?entity_type=RainfallAnomaly&country=IND&from=2024-01&to=2024-12&date=${encodeURIComponent(currentDate)}`,
      )
      return normalizeSeries(payload)
    },
    retry: 1,
    staleTime: 5 * 60_000,
  })

  const series = query.data?.length ? query.data : timelineSeries

  return (
    <div className="rounded-xl border border-[#1f2a3b] bg-[#0d1828] p-4">
      {query.isFetching && <p className="mb-2 text-xs text-[#91a5c2]">Refreshing time series...</p>}
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={series}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27364d" />
          <XAxis dataKey="month" stroke="#8ea3c1" />
          <YAxis stroke="#8ea3c1" />
          <Tooltip contentStyle={{ backgroundColor: '#122136', border: '1px solid #2d3d54', color: '#e6edf7' }} />
          <Line type="monotone" dataKey="rainfall" stroke="#4db8ff" dot={false} />
          <Line type="monotone" dataKey="dengue" stroke="#ff6b6b" dot={false} />
          <Line type="monotone" dataKey="foodPrice" stroke="#f5b562" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
