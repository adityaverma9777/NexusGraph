import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../lib/api'
import AlertBanner from '../ui/AlertBanner'

type Alert = {
  id: string
  title: string
  fired_at?: string
  severity: string
  description?: string
  affected_countries?: string[]
}

function normalizeAlerts(payload: unknown): Alert[] {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return []
  const top = payload as Record<string, unknown>
  const source = Array.isArray(top.alerts) ? top.alerts : []
  return source
    .filter((a): a is Record<string, unknown> => Boolean(a && typeof a === 'object'))
    .map((a, i) => ({
      id: typeof a.id === 'string' ? a.id : `alert-${i}`,
      title: typeof a.title === 'string' ? a.title : 'Intelligence Alert',
      fired_at: typeof a.fired_at === 'string' ? a.fired_at : undefined,
      severity: typeof a.severity === 'string' ? a.severity : 'medium',
      description: typeof a.description === 'string' ? a.description : undefined,
      affected_countries: Array.isArray(a.affected_countries) ? a.affected_countries : [],
    }))
}

export default function EventStream() {
  const { data: alerts = [], isFetching, isError } = useQuery<Alert[]>({
    queryKey: ['alerts-active'],
    queryFn: async () => {
      const payload = await apiClient('/api/alerts/active')
      return normalizeAlerts(payload)
    },
    retry: 1,
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  })

  return (
    <div className="rounded-2xl border border-[#1f2a3b] bg-[#0f1724]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">Event Stream</p>
          <h3 className="mt-1 text-lg font-semibold text-[#f3f7ff]">Active intelligence signals</h3>
        </div>
        {isFetching && (
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#4db8ff]" title="Refreshing" />
        )}
      </div>
      <ul className="mt-4 space-y-3">
        {alerts.length > 0
          ? alerts.map((alert) => (
              <li key={alert.id}>
                <AlertBanner
                  title={alert.title}
                  detail={[
                    alert.fired_at ? `Fired: ${alert.fired_at.slice(0, 10)}` : null,
                    alert.affected_countries?.length ? `Countries: ${alert.affected_countries.join(', ')}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  severity={alert.severity as 'low' | 'medium' | 'high' | 'critical'}
                />
              </li>
            ))
          : !isFetching && !isError && (
              <li className="rounded-xl border border-[#1f2a3b] bg-[#0a1220] px-4 py-5 text-center">
                <p className="text-sm text-[#c6d7ec]">No active alerts</p>
                <p className="mt-1 text-xs text-[#5a7090]">
                  Run the backend ETL and alert_runner.py to populate real signals.
                </p>
              </li>
            )}
        {isError && (
          <li className="rounded-xl border border-[#2a1f1f] bg-[#1a0a0a] px-4 py-3 text-xs text-[#ef233c]">
            Backend not connected — start the FastAPI server to see live alerts.
          </li>
        )}
      </ul>
    </div>
  )
}
