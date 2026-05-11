import { useEffect, useMemo, useState } from 'react'
import AlertBanner from './AlertBanner'
import { useIntelligence } from '../../hooks/useIntelligence'
import { useGraph } from '../../hooks/useGraph'
import { useGraphStore } from '../../store/graphStore'

type RiskCard = {
  risk: string
  domain: string
  probability: string
  confidenceScore: number
  impactScore: number
  timeframe: string
  pathway: string[]
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

type IntelligenceBriefingProps = {
  entityId?: string
  contextNodeIds?: string[]
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

function toNumber(input: unknown, fallback: number): number {
  if (typeof input === 'number' && Number.isFinite(input)) {
    return input
  }
  if (typeof input === 'string') {
    const parsed = Number(input)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return fallback
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
        domain: typeof record.domain === 'string' ? record.domain : 'unknown',
        probability: typeof record.probability === 'string' ? record.probability : 'UNKNOWN',
        confidenceScore: toNumber(record.confidenceScore ?? record.confidence_score, 50),
        impactScore: toNumber(record.impactScore ?? record.impact_score, 50),
        timeframe: typeof record.timeframe === 'string' ? record.timeframe : 'unknown',
        pathway: toStringArray(record.pathway),
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
    classification: typeof source.classification === 'string' ? source.classification : '',
    situationSummary:
      typeof source.situationSummary === 'string'
        ? source.situationSummary
        : typeof source.situation_summary === 'string'
          ? source.situation_summary
          : '',
    contributingFactors: toStringArray(source.contributingFactors ?? source.contributing_factors),
    downstreamRisks: toRiskCards(source.downstreamRisks ?? source.downstream_risks),
    confidenceAssessment:
      typeof source.confidenceAssessment === 'string'
        ? source.confidenceAssessment
        : typeof source.confidence_assessment === 'string'
          ? source.confidence_assessment
          : '',
    dataGaps: toStringArray(source.dataGaps ?? source.data_gaps),
    recommendedMonitoring: toStringArray(source.recommendedMonitoring ?? source.recommended_monitoring),
  }
}

export default function IntelligenceBriefing({ entityId, contextNodeIds = [] }: IntelligenceBriefingProps) {
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId)
  const setSelectedNodeId = useGraphStore((state) => state.setSelectedNodeId)
  const setSelectedEdgeId = useGraphStore((state) => state.setSelectedEdgeId)
  const clearPath = useGraphStore((state) => state.clearPath)
  const setSearchQuery = useGraphStore((state) => state.setSearchQuery)
  const setCascadeType = useGraphStore((state) => state.setCascadeType)
  const { nodes } = useGraph()
  const [activeRiskIndex, setActiveRiskIndex] = useState<number | null>(null)
  const activeEntityId = entityId ?? selectedNodeId
  const query = useIntelligence(activeEntityId ? { entityId: activeEntityId, contextNodes: contextNodeIds } : undefined)
  const briefing = normalizeBriefing(query.data)

  useEffect(() => {
    setActiveRiskIndex(null)
  }, [briefing?.headline, activeEntityId])

  const activeRisk = useMemo(() => {
    if (activeRiskIndex === null || !briefing) {
      return null
    }
    return briefing.downstreamRisks[activeRiskIndex] ?? null
  }, [activeRiskIndex, briefing])

  function resolveRiskNode(risk: RiskCard) {
    if (!nodes || nodes.length === 0) {
      return undefined
    }

    const riskDomain = risk.domain ?? 'unknown'
    const keywords = `${risk.risk} ${riskDomain} ${risk.pathway.join(' ')}`.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length >= 4)
    let bestNodeId: string | undefined
    let bestScore = 0

    try {
      for (const node of nodes) {
        if (!node || !node.id) continue
        let score = 0
        const label = `${node.label ?? ''} ${node.entityType ?? ''} ${node.domain ?? ''}`.toLowerCase()
        if (node.domain?.toLowerCase?.() === riskDomain.toLowerCase()) {
          score += 4
        }
        for (const keyword of keywords) {
          if (keyword && label.includes(keyword)) {
            score += 1
          }
        }
        if (score > bestScore) {
          bestScore = score
          bestNodeId = node.id
        }
      }
    } catch (error) {
      console.warn('Error resolving risk node:', error)
      return undefined
    }

    return bestNodeId
  }

  function handleRiskClick(event: React.MouseEvent<HTMLButtonElement>, risk: RiskCard, index: number) {
    event.preventDefault()
    event.stopPropagation()
    
    if (!nodes || nodes.length === 0) {
      console.warn('Cannot click risk: no graph nodes available')
      return
    }

    try {
      setActiveRiskIndex(index)
      setSelectedEdgeId(undefined)
      clearPath()
      setCascadeType('')

      const matchedNodeId = resolveRiskNode(risk)
      if (matchedNodeId) {
        setSelectedNodeId(matchedNodeId)
        setSearchQuery(risk.risk)
      } else {
        setSelectedNodeId(undefined)
        setSearchQuery('')
      }
    } catch (error) {
      console.error('Error handling risk click:', error)
      setActiveRiskIndex(null)
      setSelectedNodeId(undefined)
      setSelectedEdgeId(undefined)
    }
  }

  if (!activeEntityId) {
    return (
      <div className="rounded-2xl border border-[#1a1a1a] bg-[#0f1724]/95 p-6 text-sm text-[#bbbbbb] shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
        Select a graph node or relationship to generate a live intelligence briefing.
      </div>
    )
  }

  if (query.isFetching && !briefing) {
    return (
      <div className="rounded-2xl border border-[#1a1a1a] bg-[#0f1724]/95 p-6 text-sm text-[#bbbbbb] shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
        Generating live intelligence briefing...
      </div>
    )
  }

  if (!briefing) {
    return (
      <div className="rounded-2xl border border-[#2a1f1f] bg-[#180d12] p-6 text-sm text-[#ef9aa9] shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
        Live briefing data is unavailable for the selected entity.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AlertBanner title={briefing.headline} detail={briefing.classification} />
      {query.isFetching && (
        <p className="text-xs uppercase tracking-[0.2em] text-[#bbbbbb]">Refreshing intelligence...</p>
      )}
      <div className="rounded-2xl border border-[#1a1a1a] bg-[#0f1724]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[#aaaaaa]">Situation Summary</p>
        <p className="mt-3 text-sm text-[#dddddd]">{briefing.situationSummary || 'No summary returned.'}</p>
      </div>

      <div className="rounded-2xl border border-[#1a1a1a] bg-[#0f1724]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[#aaaaaa]">Contributing Factors</p>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-[#dddddd]">
          {(briefing.contributingFactors.length ? briefing.contributingFactors : ['No contributing factors returned.']).map((factor, index) => (
            <li key={index}>{factor}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-[#1a1a1a] bg-[#0f1724]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[#aaaaaa]">Downstream Risks</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {(briefing.downstreamRisks.length ? briefing.downstreamRisks : [{ risk: 'No downstream risks returned.', domain: 'unknown', probability: 'N/A', confidenceScore: 0, impactScore: 0, timeframe: 'N/A', pathway: [] }]).map((risk, index) => {
            const canResolve = nodes && nodes.length > 0
            return (
            <button
              key={index}
              type="button"
              onClick={(event) => handleRiskClick(event, risk, index)}
              disabled={!canResolve}
              className={`rounded-lg border p-3 text-left transition-colors ${activeRiskIndex === index ? 'border-[#ffffff] bg-[#14253b]' : 'border-[#222222] bg-[#101b2c] hover:bg-[#122136]'} ${!canResolve ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#f0f0f0]">{risk.risk}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#8ea3c1]">{risk.domain}</p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${canResolve ? 'border-[#222222] text-[#dddddd]' : 'border-[#3a2b2b] text-[#7f6565]'}`}>
                  {canResolve ? 'Open in graph' : 'No graph data'}
                </span>
              </div>
              <p className="mt-2 text-xs text-[#cccccc]">
                {risk.probability} probability | {risk.timeframe}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-[#dddddd]">
                <span className="rounded-md border border-[#23344a] bg-[#0c1726] px-2 py-1">Confidence {risk.confidenceScore}%</span>
                <span className="rounded-md border border-[#23344a] bg-[#0c1726] px-2 py-1">Impact {risk.impactScore}%</span>
              </div>
            </button>
            )
          })}
        </div>
        {activeRisk && (
          <div className="mt-4 rounded-xl border border-[#24415f] bg-[#0a1422] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#aaaaaa]">Risk Pathway</p>
                <h4 className="mt-1 text-sm font-semibold text-[#ffffff]">{activeRisk.risk}</h4>
              </div>
              <p className="text-xs text-[#bbbbbb]">Confidence {activeRisk.confidenceScore}% | Impact {activeRisk.impactScore}%</p>
            </div>
            <div className="mt-4 space-y-2">
              {(activeRisk.pathway && activeRisk.pathway.length ? activeRisk.pathway : ['Pathway details not available. Try ingesting more data.']).map((step, index) => (
                <div key={index} className="flex items-start gap-3 text-sm text-[#dddddd]">
                  <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-[#33506f] bg-[#102033] text-[10px] text-[#aaaaaa]">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p>{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#0f1724]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
          <p className="text-xs uppercase tracking-[0.3em] text-[#aaaaaa]">Confidence</p>
          <p className="mt-2 text-sm text-[#dddddd]">{briefing.confidenceAssessment || 'No confidence assessment returned.'}</p>
        </div>
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#0f1724]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
          <p className="text-xs uppercase tracking-[0.3em] text-[#aaaaaa]">Data Gaps</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[#dddddd]">
            {(briefing.dataGaps.length ? briefing.dataGaps : ['No data gaps returned.']).map((gap, index) => (
              <li key={index}>{gap}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-[#1a1a1a] bg-[#0f1724]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[#aaaaaa]">Recommended Monitoring</p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-[#dddddd]">
          {(briefing.recommendedMonitoring.length ? briefing.recommendedMonitoring : ['No monitoring guidance returned.']).map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
