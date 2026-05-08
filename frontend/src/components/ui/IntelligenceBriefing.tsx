import AlertBanner from './AlertBanner'
import { briefingData } from '../../lib/mockData'
import { useIntelligence } from '../../hooks/useIntelligence'
import { useGraphStore } from '../../store/graphStore'

type RiskCard = {
  risk: string
  probability: string
  timeframe: string
}

type BriefingViewModel = {
  headline: string
  classification: string
  situationSummary: string
  contributingFactors: string[]
  downstreamRisks: RiskCard[]
  confidenceAssessment: string
  dataGaps: string[]
  recommendedMonitoring: string[]
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function toStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return []
  }

  return input.filter((item): item is string => typeof item === 'string')
}

function toRiskCards(input: unknown): RiskCard[] {
  if (!Array.isArray(input)) {
    return []
  }

  return input
    .map((item) => {
      const record = asRecord(item)
      if (!record) {
        return null
      }

      const risk = typeof record.risk === 'string' ? record.risk : undefined
      if (!risk) {
        return null
      }

      return {
        risk,
        probability: typeof record.probability === 'string' ? record.probability : 'UNKNOWN',
        timeframe: typeof record.timeframe === 'string' ? record.timeframe : 'unknown',
      }
    })
    .filter((item): item is RiskCard => Boolean(item))
}

function normalizeBriefing(input: unknown): BriefingViewModel | null {
  const top = asRecord(input)
  if (!top) {
    return null
  }

  const nested = asRecord(top.data)
  const source = nested ?? top
  const headline = typeof source.headline === 'string' ? source.headline : undefined
  if (!headline) {
    return null
  }

  return {
    headline,
    classification:
      typeof source.classification === 'string' ? source.classification : briefingData.classification,
    situationSummary:
      typeof source.situationSummary === 'string'
        ? source.situationSummary
        : typeof source.situation_summary === 'string'
          ? source.situation_summary
          : briefingData.situationSummary,
    contributingFactors:
      toStringArray(source.contributingFactors ?? source.contributing_factors).length > 0
        ? toStringArray(source.contributingFactors ?? source.contributing_factors)
        : briefingData.contributingFactors,
    downstreamRisks:
      toRiskCards(source.downstreamRisks ?? source.downstream_risks).length > 0
        ? toRiskCards(source.downstreamRisks ?? source.downstream_risks)
        : briefingData.downstreamRisks,
    confidenceAssessment:
      typeof source.confidenceAssessment === 'string'
        ? source.confidenceAssessment
        : typeof source.confidence_assessment === 'string'
          ? source.confidence_assessment
          : briefingData.confidenceAssessment,
    dataGaps: toStringArray(source.dataGaps ?? source.data_gaps).length
      ? toStringArray(source.dataGaps ?? source.data_gaps)
      : briefingData.dataGaps,
    recommendedMonitoring:
      toStringArray(source.recommendedMonitoring ?? source.recommended_monitoring).length > 0
        ? toStringArray(source.recommendedMonitoring ?? source.recommended_monitoring)
        : briefingData.recommendedMonitoring,
  }
}

export default function IntelligenceBriefing() {
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId)
  const query = useIntelligence(selectedNodeId ? { entityId: selectedNodeId } : undefined)
  const briefing = normalizeBriefing(query.data) ?? briefingData

  return (
    <div className="space-y-6">
      <AlertBanner
        title={briefing.headline}
        detail={briefing.classification}
      />
      {query.isFetching && (
        <p className="text-xs uppercase tracking-[0.2em] text-[#6a6374]">Refreshing intelligence...</p>
      )}
      <div className="rounded-2xl border border-[#e0dcd4] bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-[#6a6374]">Situation Summary</p>
        <p className="mt-3 text-sm text-[#4d4852]">{briefing.situationSummary}</p>
      </div>

      <div className="rounded-2xl border border-[#e0dcd4] bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-[#6a6374]">Contributing Factors</p>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-[#4d4852]">
          {briefing.contributingFactors.map((factor, idx) => (
            <li key={idx}>{factor}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-[#e0dcd4] bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-[#6a6374]">Downstream Risks</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {briefing.downstreamRisks.map((risk, idx) => (
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
          <p className="mt-2 text-sm text-[#4d4852]">{briefing.confidenceAssessment}</p>
        </div>
        <div className="rounded-2xl border border-[#e0dcd4] bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-[#6a6374]">Data Gaps</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[#4d4852]">
            {briefing.dataGaps.map((gap, idx) => (
              <li key={idx}>{gap}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-[#e0dcd4] bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-[#6a6374]">Recommended Monitoring</p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-[#4d4852]">
          {briefing.recommendedMonitoring.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
