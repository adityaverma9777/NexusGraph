import IntelligenceBriefing from '../components/ui/IntelligenceBriefing'

export default function Briefing() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">AI Briefing</p>
        <h2 className="text-2xl font-semibold text-[#f3f7ff]">Structured intelligence output</h2>
      </div>
      <IntelligenceBriefing />
    </div>
  )
}
