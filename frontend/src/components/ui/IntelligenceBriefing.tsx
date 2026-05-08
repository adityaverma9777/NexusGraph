import AlertBanner from './AlertBanner'
import { briefingData } from '../../lib/mockData'

export default function IntelligenceBriefing() {
  return (
    <div className="space-y-6">
      <AlertBanner
        title={briefingData.headline}
        detail={briefingData.classification}
      />
      <div className="rounded-2xl border border-[#e0dcd4] bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-[#6a6374]">Situation Summary</p>
        <p className="mt-3 text-sm text-[#4d4852]">{briefingData.situationSummary}</p>
      </div>

      <div className="rounded-2xl border border-[#e0dcd4] bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-[#6a6374]">Contributing Factors</p>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-[#4d4852]">
          {briefingData.contributingFactors.map((factor, idx) => (
            <li key={idx}>{factor}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-[#e0dcd4] bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-[#6a6374]">Downstream Risks</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {briefingData.downstreamRisks.map((risk, idx) => (
            <div key={idx} className="rounded-lg border border-[#e0dcd4] p-3">
              <p className="font-semibold text-[#3c3741]">{risk.risk}</p>
              <p className="mt-1 text-xs text-[#6a6374]">
                {risk.probability} · {risk.timeframe}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-[#e0dcd4] bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-[#6a6374]">Confidence</p>
          <p className="mt-2 text-sm text-[#4d4852]">{briefingData.confidenceAssessment}</p>
        </div>
        <div className="rounded-2xl border border-[#e0dcd4] bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-[#6a6374]">Data Gaps</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[#4d4852]">
            {briefingData.dataGaps.map((gap, idx) => (
              <li key={idx}>{gap}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-[#e0dcd4] bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-[#6a6374]">Recommended Monitoring</p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-[#4d4852]">
          {briefingData.recommendedMonitoring.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
