import { useState, useEffect } from 'react'
import { cascadeSteps } from '../../lib/mockData'

const SCENARIOS = [
  {
    label: 'Monsoon → Dengue',
    steps: [
      'Rainfall anomaly intensifies (+38%)',
      'Mosquito breeding conditions surge',
      'Dengue incidence accelerates',
      'Healthcare system stress rises',
      'Labor productivity declines',
    ],
  },
  {
    label: 'Deforestation → Zoonotic',
    steps: [
      'Amazon deforestation accelerates',
      'Wildlife habitat displacement',
      'Human-animal contact increases',
      'Zoonotic spillover risk rises',
      'Disease surveillance strained',
    ],
  },
  {
    label: 'Food → Migration',
    steps: [
      'Crop failure due to drought',
      'Food price index spikes',
      'Rural income collapses',
      'Internal migration wave',
      'Urban informal settlement growth',
    ],
  },
]

const relationshipColors: Record<string, string> = {
  DRIVES: '#4db8ff',
  AMPLIFIES: '#f4a261',
  TRIGGERS: '#ef233c',
  STRESSES: '#c77dff',
  REDUCES: '#52b788',
}

const stepRelationships = ['DRIVES', 'AMPLIFIES', 'TRIGGERS', 'STRESSES', 'REDUCES']

export default function CascadeAnimation() {
  const [activeStep, setActiveStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [scenarioIdx, setScenarioIdx] = useState(0)

  const scenario = SCENARIOS[scenarioIdx]
  const steps = cascadeSteps.length ? cascadeSteps : scenario.steps

  useEffect(() => {
    if (!isPlaying) return
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length)
    }, 2000)
    return () => clearInterval(timer)
  }, [isPlaying, steps.length])

  useEffect(() => {
    setActiveStep(0)
  }, [scenarioIdx])

  return (
    <div className="rounded-2xl border border-[#1f2a3b] bg-[#0f1724]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">Cascade</p>
          <h3 className="mt-1 text-lg font-semibold text-[#f3f7ff]">Systemic ripple playback</h3>
        </div>
        <button
          type="button"
          onClick={() => setIsPlaying((p) => !p)}
          className="rounded-full border border-[#2f4564] bg-[#193254] px-3 py-1.5 text-xs font-semibold text-[#eaf2ff] hover:bg-[#23456f]"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        {SCENARIOS.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setScenarioIdx(idx)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              scenarioIdx === idx
                ? 'bg-[#193254] text-[#eaf2ff] border border-[#4e79ab]'
                : 'text-[#91a5c2] border border-[#1f2a3b] hover:border-[#406188]'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="mt-5 space-y-2">
        {steps.map((step, idx) => {
          const rel = stepRelationships[idx] ?? 'DRIVES'
          const color = relationshipColors[rel]
          const isActive = idx === activeStep
          const isPast = idx < activeStep
          return (
            <div key={idx} className="flex items-start gap-3">
              <div className="flex flex-col items-center pt-1">
                <div
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all ${
                    isActive
                      ? 'scale-110 border-current text-white'
                      : isPast
                        ? 'border-current opacity-60'
                        : 'border-[#2a3b53] text-[#5a7090]'
                  }`}
                  style={isActive || isPast ? { borderColor: color, color } : undefined}
                >
                  {idx + 1}
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`mt-1 w-0.5 flex-1 min-h-[16px] rounded transition-all ${
                      isPast ? 'opacity-50' : 'opacity-10'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                )}
              </div>
              <div
                className={`mb-2 flex-1 rounded-lg border px-3 py-2 text-sm transition-all ${
                  isActive
                    ? 'border-current bg-[#0d1e33]'
                    : isPast
                      ? 'border-[#1f2a3b] bg-[#0d1420] opacity-70'
                      : 'border-[#1a2538] bg-transparent opacity-40'
                }`}
                style={isActive ? { borderColor: color } : undefined}
              >
                {isActive && (
                  <span
                    className="mb-1 block text-[10px] font-bold uppercase tracking-widest"
                    style={{ color }}
                  >
                    {rel}
                  </span>
                )}
                <span className={isActive ? 'text-[#eaf2ff]' : isPast ? 'text-[#9ab0cd]' : 'text-[#4a6080]'}>
                  {step}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
