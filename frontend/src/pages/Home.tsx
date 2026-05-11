import { useQuery } from '@tanstack/react-query'
import CorrelationMatrix from '../components/charts/CorrelationMatrix'
import DomainRadar from '../components/charts/DomainRadar'
import TimeSeriesChart from '../components/charts/TimeSeriesChart'
import EdgePanel from '../components/graph/EdgePanel'
import ErrorBoundary from '../components/ui/ErrorBoundary'
import GraphCanvas from '../components/graph/GraphCanvas'
import ImpactChain from '../components/graph/ImpactChain'
import NodePanel from '../components/graph/NodePanel'
import IntelligenceBriefing from '../components/ui/IntelligenceBriefing'
import { useGraph } from '../hooks/useGraph'
import { useGraphStore } from '../store/graphStore'
import { apiClient } from '../lib/api'

const severityDot: Record<string, string> = {
  high: '#ef233c',
  critical: '#ff4444',
  medium: '#f4a261',
  low: '#52b788',
}

type HomeAlert = {
  id: string
  title: string
  firedAt: string
  severity: string
}

function normalizeAlerts(payload: unknown): HomeAlert[] {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return []
  const source = Array.isArray((payload as { alerts?: unknown[] }).alerts) ? (payload as { alerts: unknown[] }).alerts : []
  return source
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
    .map((item, index) => ({
      id: typeof item.id === 'string' ? item.id : `alert-${index}`,
      title: typeof item.title === 'string' ? item.title : 'Intelligence Alert',
      firedAt: typeof item.fired_at === 'string' ? item.fired_at.slice(0, 10) : 'Unknown',
      severity: typeof item.severity === 'string' ? item.severity : 'medium',
    }))
}

export default function Home() {
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId)
  const selectedEdgeId = useGraphStore((state) => state.selectedEdgeId)
  const { nodes, edges } = useGraph()
  const { data: alerts = [] } = useQuery<HomeAlert[]>({
    queryKey: ['home-alerts'],
    queryFn: async () => {
      const payload = await apiClient('/api/alerts/active')
      return normalizeAlerts(payload)
    },
    retry: 1,
    staleTime: 5 * 60_000,
  })

  const topAlerts = alerts.slice(0, 3).map((alert) => ({
    id: alert.id,
    title: alert.title,
    date: alert.firedAt,
    severity: alert.severity,
  }))

  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId)
  const analysisEntityId = selectedEdge ? selectedEdge.source : selectedNodeId
  const analysisContextIds = selectedEdge ? [selectedEdge.source, selectedEdge.target] : selectedNodeId ? [selectedNodeId] : []

  return (
    <div className="flex flex-col">
      <section className="w-full">
        <GraphCanvas />
      </section>
      <div className="mx-auto w-full max-w-[1440px] space-y-6 px-8 py-8">
        <div className="flex flex-wrap gap-2">
        {topAlerts.length > 0 ? (
          topAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center gap-2 rounded-full border border-[#1a1a1a] bg-[#000000] px-4 py-2 text-xs"
            >
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: severityDot[alert.severity] ?? '#bbbbbb' }}
              />
              <span className="text-[#dddddd]">{alert.title}</span>
              <span className="text-[#999999]">{alert.date}</span>
            </div>
          ))
        ) : (
          <div className="rounded-full border border-[#1a1a1a] bg-[#000000] px-4 py-2 text-xs text-[#999999]">
            No active alerts
          </div>
        )}
      </div>
      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <NodePanel />
        <EdgePanel />
      </section>
      {analysisEntityId && (
        <ErrorBoundary fallback="Intelligence briefing temporarily unavailable. Try selecting a different node.">
          <section className="space-y-4 rounded-2xl border border-[#1a1a1a] bg-[#0f1724]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#aaaaaa]">Graph Analysis</p>
                <h2 className="text-2xl font-semibold text-[#ffffff]">Selected node or relationship impact chain</h2>
              </div>
              {selectedEdge && (
                <p className="text-xs text-[#bbbbbb]">
                  {nodes.find((node) => node.id === selectedEdge.source)?.label ?? selectedEdge.source} →{' '}
                  {nodes.find((node) => node.id === selectedEdge.target)?.label ?? selectedEdge.target}
                </p>
              )}
            </div>
            <IntelligenceBriefing entityId={analysisEntityId} contextNodeIds={analysisContextIds} />
          </section>
          {analysisEntityId && <ImpactChain />}
        </ErrorBoundary>
      )}
      <section className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-4 rounded-2xl border border-[#1a1a1a] bg-[#0f1724]/95 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
          <p className="text-xs uppercase tracking-[0.3em] text-[#aaaaaa]">Temporal Analytics</p>
          <TimeSeriesChart />
          <CorrelationMatrix />
        </div>
        <div className="space-y-4 rounded-2xl border border-[#1a1a1a] bg-[#0f1724]/95 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
          <p className="text-xs uppercase tracking-[0.3em] text-[#aaaaaa]">Domain Risk Profile</p>
          <DomainRadar />
        </div>
      </section>
      </div>
    </div>
  )
}
