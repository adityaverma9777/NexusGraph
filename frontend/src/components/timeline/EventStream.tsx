import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../lib/api'
import { useGraphStore } from '../../store/graphStore'
import { timelineEvents } from '../../lib/mockData'
import AlertBanner from '../ui/AlertBanner'

type TimelineEvent = {
  id: string
  title: string
  date: string
  severity: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function toEvent(input: unknown, index: number): TimelineEvent | null {
  const record = asRecord(input)
  if (!record) {
    return null
  }

  const title =
    typeof record.title === 'string'
      ? record.title
      : typeof record.message === 'string'
        ? record.message
        : undefined
  if (!title) {
    return null
  }

  return {
    id: typeof record.id === 'string' ? record.id : `alert-${index}`,
    title,
    date:
      typeof record.date === 'string'
        ? record.date
        : typeof record.timestamp === 'string'
          ? record.timestamp
          : 'unknown',
    severity: typeof record.severity === 'string' ? record.severity : 'medium',
  }
}

function normalizeEvents(payload: unknown): TimelineEvent[] | null {
  const top = asRecord(payload)
  if (!top) {
    return null
  }

  const nested = asRecord(top.data)
  const source =
    (Array.isArray(top.alerts) ? top.alerts : undefined) ??
    (Array.isArray(top.events) ? top.events : undefined) ??
    (Array.isArray(nested?.alerts) ? nested.alerts : undefined)

  if (!source) {
    return null
  }

  const events = source
    .map((item, index) => toEvent(item, index))
    .filter((item): item is TimelineEvent => Boolean(item))

  return events.length ? events : null
}

export default function EventStream() {
  const currentDate = useGraphStore((s) => s.currentDate)

  const query = useQuery({
    queryKey: ['alerts-active', currentDate],
    queryFn: async () => {
      const payload = await apiClient(`/api/alerts/active?date=${encodeURIComponent(currentDate)}`)
      return normalizeEvents(payload)
    },
    retry: 1,
    staleTime: 2 * 60_000,
  })

  const events = query.data?.length ? query.data : timelineEvents

  return (
    <div className="rounded-2xl border border-[#1f2a3b] bg-[#0f1724]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
      <p className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">Event Stream</p>
      <h3 className="mt-1 text-lg font-semibold text-[#f3f7ff]">Latest signals</h3>
      {query.isFetching && <p className="mt-2 text-xs text-[#91a5c2]">Refreshing active alerts...</p>}
      <ul className="mt-4 space-y-3">
        {events.map((event) => (
          <li key={event.id}>
            <AlertBanner
              title={event.title}
              detail={`Date: ${event.date} · Severity: ${event.severity}`}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
