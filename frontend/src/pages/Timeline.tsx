import CascadeAnimation from '../components/timeline/CascadeAnimation'
import EventStream from '../components/timeline/EventStream'
import TimelineSlider from '../components/timeline/TimelineSlider'

export default function Timeline() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e0dcd4] bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-[#6a6374]">Time Simulation</p>
        <h2 className="text-2xl font-semibold">Replay system evolution</h2>
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
