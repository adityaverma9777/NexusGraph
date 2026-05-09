import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { apiClient } from '../../lib/api'
import { useGraph } from '../../hooks/useGraph'
import { useGraphStore } from '../../store/graphStore'

type SeriesRow = {
  month: string
  primary: number
}

type TimeSeriesPoint = {
  date?: string
  value?: number
}

function normalizePoints(payload: unknown): TimeSeriesPoint[] {
  if (!Array.isArray(payload)) {
    return []
  }
  return payload
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
    .map((item) => ({
      date: typeof item.date === 'string' ? item.date : undefined,
      value: typeof item.value === 'number' ? item.value : undefined,
    }))
    .filter((item): item is TimeSeriesPoint & { date: string; value: number } => Boolean(item.date && typeof item.value === 'number'))
}

function mergeSeries(points: TimeSeriesPoint[]): SeriesRow[] {
  const byMonth = new Map<string, SeriesRow>()
  for (const point of points) {
    if (!point.date || typeof point.value !== 'number') continue
    const month = point.date.slice(0, 7)
    const row = byMonth.get(month) ?? { month, primary: 0 }
    row.primary = point.value
    byMonth.set(month, row)
  }
  return Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month))
}

export default function TimeSeriesChart() {
  const currentDate = useGraphStore((s) => s.currentDate)
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId)
  const { nodes } = useGraph()
  const selectedNode =
    nodes.find((node) => node.id === selectedNodeId && node.domain !== 'meta') ??
    nodes.find((node) => node.domain !== 'meta')
  const countryCode =
    selectedNode && selectedNode.properties && typeof selectedNode.properties.country_code === 'string'
      ? selectedNode.properties.country_code
      : undefined
  const title = selectedNode ? `${selectedNode.entityType} | ${countryCode ?? 'N/A'}` : 'No active series'

  const query = useQuery({
    queryKey: ['metrics-timeseries', selectedNode?.entityType, countryCode, currentDate],
    enabled: Boolean(selectedNode?.entityType && countryCode),
    queryFn: async () => {
      const payload = await apiClient(
        `/api/metrics/timeseries?entity_type=${encodeURIComponent(selectedNode!.entityType)}&country=${encodeURIComponent(countryCode!)}&from=2015-01-01&to=${encodeURIComponent(currentDate)}`,
      )
      return mergeSeries(normalizePoints(payload))
    },
    retry: 1,
    staleTime: 5 * 60_000,
  })

  const series = query.data ?? []

  return (
    <div className="rounded-xl border border-[#1f2a3b] bg-[#0d1828] p-4">
      <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#7f93b1]">{title}</p>
      {query.isFetching && <p className="mb-2 text-xs text-[#91a5c2]">Refreshing time series...</p>}
      {series.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27364d" />
            <XAxis dataKey="month" stroke="#8ea3c1" />
            <YAxis stroke="#8ea3c1" />
            <Tooltip contentStyle={{ backgroundColor: '#122136', border: '1px solid #2d3d54', color: '#e6edf7' }} />
            <Line type="monotone" dataKey="primary" stroke="#4db8ff" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[200px] items-center justify-center text-sm text-[#7f93b1]">
          No live time-series data available for the active graph selection
        </div>
      )}
    </div>
  )
}
