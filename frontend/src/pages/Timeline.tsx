import { useState } from 'react'
import CascadeAnimation from '../components/timeline/CascadeAnimation'
import EventStream from '../components/timeline/EventStream'
import TimelineSlider from '../components/timeline/TimelineSlider'
import { useGraphStore } from '../store/graphStore'

const SCENARIOS = [
  {
    id: 'monsoon',
    title: 'Indian Monsoon Failure',
    subtitle: 'Food Prices -> Migration',
    description:
      'Deficit monsoon rainfall drives crop yield collapse, triggering food price spikes in Punjab and Bihar, cascading into rural-to-urban migration waves.',
    startDate: '2023-06',
    cascadeType: 'RainfallAnomaly',
    domain: 'climate',
    color: '#00b4d8',
  },
  {
    id: 'amazon',
    title: 'Amazon Deforestation',
    subtitle: 'Disease Risk -> Healthcare Stress',
    description:
      'Accelerating forest loss in the Amazon basin drives wildlife displacement, elevating zoonotic spillover risk and straining regional healthcare capacity.',
    startDate: '2023-01',
    cascadeType: 'DeforestationEvent',
    domain: 'ecology',
    color: '#52b788',
  },
  {
    id: 'ukraine',
    title: 'Ukraine Conflict',
    subtitle: 'Global Food Price -> Developing World Hunger',
    description:
      'Conflict-driven disruption to wheat and sunflower exports drives global food price index surges, hitting low-HDI nations with compounding hunger risks.',
    startDate: '2022-02',
    cascadeType: 'ConflictEvent',
    domain: 'infrastructure',
    color: '#c77dff',
  },
  {
    id: 'pollution',
    title: 'Air Pollution + Urbanization',
    subtitle: 'Respiratory Disease Cascade',
    description:
      'Rising PM2.5 concentrations in South Asian megacities, amplified by rapid urban expansion, drive respiratory disease incidence and healthcare system load.',
    startDate: '2024-01',
    cascadeType: 'AirPollutionEvent',
    domain: 'disease',
    color: '#ef233c',
  },
  {
    id: 'elnino',
    title: 'El Nino Signal',
    subtitle: 'Drought -> Conflict -> Displacement Chain',
    description:
      'El Nino-driven drought weakens monsoons, collapses crop yields in the Horn of Africa and Southeast Asia, triggering conflict and mass displacement.',
    startDate: '2023-09',
    cascadeType: 'OceanTemperatureAnomaly',
    domain: 'climate',
    color: '#f4a261',
  },
]

export default function Timeline() {
  const [activeScenario, setActiveScenario] = useState<string | null>(null)
  const setCurrentDate = useGraphStore((state) => state.setCurrentDate)
  const setCascadeType = useGraphStore((state) => state.setCascadeType)
  const setSearchQuery = useGraphStore((state) => state.setSearchQuery)
  const setSelectedNodeId = useGraphStore((state) => state.setSelectedNodeId)
  const clearPath = useGraphStore((state) => state.clearPath)

  function loadScenario(scenario: (typeof SCENARIOS)[0]) {
    clearPath()
    setSelectedNodeId(undefined)
    setActiveScenario(scenario.id)
    setCurrentDate(scenario.startDate)
    setCascadeType(scenario.cascadeType)
    setSearchQuery('')
  }

  function clearScenario() {
    clearPath()
    setActiveScenario(null)
    setCascadeType('')
    setSearchQuery('')
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#1a1a1a] bg-[#0f1724]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#aaaaaa]">Time Simulation</p>
            <h2 className="text-2xl font-semibold text-[#ffffff]">Replay system evolution</h2>
          </div>
          {activeScenario && (
            <button
              type="button"
              onClick={clearScenario}
              className="rounded-full border border-[#222222] bg-[#0a0a0a] px-3 py-1.5 text-xs text-[#c5d4ea] hover:bg-[#16253a]"
            >
              Clear scenario
            </button>
          )}
        </div>
        <div className="mt-6">
          <TimelineSlider />
        </div>
      </section>
      <section className="rounded-2xl border border-[#1a1a1a] bg-[#0f1724]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[#aaaaaa]">Intelligence Scenarios</p>
        <h3 className="mt-1 text-lg font-semibold text-[#ffffff]">Curated cascade demonstrations</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              onClick={() => loadScenario(scenario)}
              className={`rounded-xl border p-4 text-left transition-all hover:scale-[1.02] ${
                activeScenario === scenario.id
                  ? 'border-current bg-[#0d1e33] shadow-[0_0_20px_rgba(0,0,0,0.4)]'
                  : 'border-[#1a1a1a] bg-[#000000] hover:border-[#222222] hover:bg-[#0a0a0a]'
              }`}
              style={activeScenario === scenario.id ? { borderColor: scenario.color } : undefined}
            >
              <div className="mb-3 h-1 w-10 rounded-full" style={{ backgroundColor: scenario.color }} />
              <p className="text-xs font-semibold text-[#dce8f9]">{scenario.title}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.12em]" style={{ color: scenario.color }}>
                {scenario.subtitle}
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-[#7090b0]">{scenario.description}</p>
              <p className="mt-3 text-[10px] text-[#999999]">From {scenario.startDate}</p>
            </button>
          ))}
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <EventStream />
        <CascadeAnimation />
      </div>
    </div>
  )
}
