import { timelineEvents } from '../../lib/mockData'
import AlertBanner from '../ui/AlertBanner'

export default function EventStream() {
  return (
    <div className="rounded-2xl border border-[#e0dcd4] bg-white p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-[#6a6374]">Event Stream</p>
      <h3 className="mt-1 text-lg font-semibold">Latest signals</h3>
      <ul className="mt-4 space-y-3">
        {timelineEvents.map((event) => (
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
