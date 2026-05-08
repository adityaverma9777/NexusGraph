import IntelligenceBriefing from '../components/ui/IntelligenceBriefing'

export default function Briefing() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[#6a6374]">AI Briefing</p>
        <h2 className="text-2xl font-semibold">Structured intelligence output</h2>
      </div>
      <IntelligenceBriefing />
    </div>
  )
}
