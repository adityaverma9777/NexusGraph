import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useGraphStore } from '../../store/graphStore'
import { apiClient } from '../../lib/api'

const BUILT_IN_SCENARIOS = [
  {
    label: 'Monsoon -> Dengue',
    cascadeType: 'RainfallAnomaly',
    steps: [
      { text: 'Rainfall anomaly intensifies (+38%)', rel: 'DRIVES' },
      { text: 'Mosquito breeding conditions surge', rel: 'AMPLIFIES' },
      { text: 'Dengue incidence accelerates', rel: 'TRIGGERS' },
      { text: 'Healthcare system stress rises', rel: 'STRESSES' },
      { text: 'Labor productivity declines', rel: 'REDUCES' },
    ],
  },
  {
    label: 'Deforestation -> Zoonotic',
    cascadeType: 'DeforestationEvent',
    steps: [
      { text: 'Amazon deforestation accelerates', rel: 'DRIVES' },
      { text: 'Wildlife habitat displacement', rel: 'SHIFTS' },
      { text: 'Human-animal contact increases', rel: 'AMPLIFIES' },
      { text: 'Zoonotic spillover risk rises', rel: 'SIGNALS' },
      { text: 'Disease surveillance strained', rel: 'STRESSES' },
    ],
  },
  {
    label: 'Food -> Migration',
    cascadeType: 'CropYieldAnomaly',
    steps: [
      { text: 'Crop failure due to drought', rel: 'DRIVES' },
      { text: 'Food price index spikes', rel: 'TRIGGERS' },
      { text: 'Rural income collapses', rel: 'REDUCES' },
      { text: 'Internal migration wave', rel: 'TRIGGERS' },
      { text: 'Urban informal settlement growth', rel: 'AMPLIFIES' },
    ],
  },
]

const REL_COLORS: Record<string, string> = {
  DRIVES: '#4db8ff',
  AMPLIFIES: '#f4a261',
  TRIGGERS: '#ef233c',
  STRESSES: '#c77dff',
  REDUCES: '#52b788',
  SHIFTS: '#00b4d8',
  SIGNALS: '#ffd166',
  PRECEDES: '#adb5bd',
  MITIGATES: '#2dc653',
  CORRELATES_WITH: '#9d4edd',
  COLLAPSES: '#ff006e',
}

type Step = {
  text: string
  rel: string
}

function CascadeSequence({ steps, isPlaying }: { steps: Step[]; isPlaying: boolean }) {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    if (!isPlaying || steps.length <= 1) {
      return
    }
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length)
    }, 2000)
    return () => clearInterval(timer)
  }, [isPlaying, steps.length])

  return (
    <div className="mt-5 space-y-2">
      {steps.map((step, idx) => {
        const color = REL_COLORS[step.rel] ?? '#4db8ff'
        const isActive = idx === activeStep
        const isPast = idx < activeStep
        return (
          <div key={idx} className="flex items-start gap-3">
            <div className="flex flex-col items-center pt-1">
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all ${
                  isActive ? 'scale-110 border-current text-white' : isPast ? 'border-current opacity-60' : 'border-[#2a3b53] text-[#5a7090]'
                }`}
                style={isActive || isPast ? { borderColor: color, color } : undefined}
              >
                {idx + 1}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`mt-1 min-h-[16px] w-0.5 flex-1 rounded transition-all ${isPast ? 'opacity-50' : 'opacity-10'}`}
                  style={{ backgroundColor: color }}
                />
              )}
            </div>
            <div
              className={`mb-2 flex-1 rounded-lg border px-3 py-2 text-sm transition-all ${
                isActive ? 'border-current bg-[#0d1e33]' : isPast ? 'border-[#1f2a3b] bg-[#0d1420] opacity-70' : 'border-[#1a2538] bg-transparent opacity-40'
              }`}
              style={isActive ? { borderColor: color } : undefined}
            >
              {isActive && (
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
                  {step.rel}
                </span>
              )}
              <span className={isActive ? 'text-[#eaf2ff]' : isPast ? 'text-[#9ab0cd]' : 'text-[#4a6080]'}>
                {step.text}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function CascadeAnimation() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [scenarioIdx, setScenarioIdx] = useState(0)
  const cascadeType = useGraphStore((s) => s.cascadeType)
  const currentDate = useGraphStore((s) => s.currentDate)

  const { data: graphPayload } = useQuery({
    queryKey: ['cascade-anim', cascadeType, currentDate],
    enabled: Boolean(cascadeType),
    queryFn: () => apiClient(`/api/graph/cascade/${encodeURIComponent(cascadeType)}?min_confidence=0.4&as_of=${currentDate}`),
    staleTime: 120_000,
  })

  const scenario = BUILT_IN_SCENARIOS[scenarioIdx]
  const liveSteps: Step[] = (() => {
    if (!graphPayload || !cascadeType) {
      return scenario.steps
    }
    const nodes: { label?: string; entity_type?: string }[] = (graphPayload as { nodes?: { label?: string; entity_type?: string }[] }).nodes ?? []
    const edges: { relationship?: string }[] = (graphPayload as { edges?: { relationship?: string }[] }).edges ?? []
    if (nodes.length < 2) {
      return scenario.steps
    }
    return nodes.slice(0, 5).map((node, index) => ({
      text: node.label ?? node.entity_type ?? `Entity ${index + 1}`,
      rel: edges[index]?.relationship ?? 'DRIVES',
    }))
  })()

  const isLive = Boolean(cascadeType && graphPayload && (graphPayload as { nodes?: unknown[] }).nodes?.length)
  const sequenceKey = isLive ? `live:${cascadeType}:${currentDate}` : `demo:${scenarioIdx}`

  return (
    <div className="rounded-2xl border border-[#1f2a3b] bg-[#0f1724]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">
            Cascade {isLive ? <span className="text-[#52b788]">- Live</span> : '- Demo'}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[#f3f7ff]">Systemic ripple playback</h3>
        </div>
        <button
          type="button"
          onClick={() => setIsPlaying((playing) => !playing)}
          className="rounded-full border border-[#2f4564] bg-[#193254] px-3 py-1.5 text-xs font-semibold text-[#eaf2ff] hover:bg-[#23456f]"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>
      {!cascadeType && (
        <div className="mt-3 flex flex-wrap gap-2">
          {BUILT_IN_SCENARIOS.map((item, index) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setScenarioIdx(index)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                scenarioIdx === index
                  ? 'border border-[#4e79ab] bg-[#193254] text-[#eaf2ff]'
                  : 'border border-[#1f2a3b] text-[#91a5c2] hover:border-[#406188]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      {isLive && (
        <p className="mt-2 text-xs text-[#52b788]">
          Showing live cascade from <span className="font-mono">{cascadeType}</span>
        </p>
      )}
      <CascadeSequence key={sequenceKey} steps={liveSteps} isPlaying={isPlaying} />
    </div>
  )
}
