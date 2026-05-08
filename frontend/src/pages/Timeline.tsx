import CascadeAnimation from '../components/timeline/CascadeAnimation'
import EventStream from '../components/timeline/EventStream'
import TimelineSlider from '../components/timeline/TimelineSlider'

export default function Timeline() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#1f2a3b] bg-[#0f1724]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">Time Simulation</p>
        <h2 className="text-2xl font-semibold text-[#f3f7ff]">Replay system evolution</h2>
        <div className="mt-6">
          <TimelineSlider />
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <EventStream />
        <CascadeAnimation />
      </div>
    </div>
  )
}
