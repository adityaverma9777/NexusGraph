import CorrelationMatrix from '../components/charts/CorrelationMatrix'
import DomainRadar from '../components/charts/DomainRadar'
import RiskGauge from '../components/charts/RiskGauge'
import TimeSeriesChart from '../components/charts/TimeSeriesChart'
import ConceptSearch from '../components/graph/ConceptSearch'
import EdgePanel from '../components/graph/EdgePanel'
import GraphCanvas from '../components/graph/GraphCanvas'
import GraphControls from '../components/graph/GraphControls'
import NodePanel from '../components/graph/NodePanel'
import { timelineEvents } from '../lib/mockData'

const severityDot: Record<string, string> = {
  high: '#ef233c',
  critical: '#ff4444',
  medium: '#f4a261',
  low: '#52b788',
}

export default function Home() {
  const topAlerts = timelineEvents.slice(0, 3)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {topAlerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-center gap-2 rounded-full border border-[#1f2a3b] bg-[#0a1220] px-4 py-2 text-xs"
          >
            <span
              className="h-2 w-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: severityDot[alert.severity] ?? '#91a5c2' }}
            />
            <span className="text-[#c6d7ec]">{alert.title}</span>
            <span className="text-[#5a7090]">{alert.date}</span>
          </div>
        ))}
      </div>
      <section className="flex flex-col gap-4 rounded-2xl border border-[#1f2a3b] bg-[#0f1724]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">Graph Explorer</p>
            <h2 className="text-2xl font-semibold text-[#f3f7ff]">Multi-domain relationship canvas</h2>
          </div>
          <GraphControls />
        </div>
        <ConceptSearch />
        <GraphCanvas />
      </section>
      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <NodePanel />
        <EdgePanel />
      </section>
      <section className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-4 rounded-2xl border border-[#1f2a3b] bg-[#0f1724]/95 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
          <p className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">Temporal Analytics</p>
          <TimeSeriesChart />
          <CorrelationMatrix />
        </div>
        <div className="space-y-4 rounded-2xl border border-[#1f2a3b] bg-[#0f1724]/95 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
          <p className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">Domain Risk Profile</p>
          <DomainRadar />
          <RiskGauge />
        </div>
      </section>
    </div>
  )
}
