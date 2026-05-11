import { useState, useRef, useEffect } from 'react'
import { useGraphStore } from '../../store/graphStore'

const QUICK_CONCEPTS = [
  { label: 'Dengue Outbreak', query: 'DengueOutbreak', domain: 'disease' },
  { label: 'Rainfall Anomaly', query: 'RainfallAnomaly', domain: 'climate' },
  { label: 'Deforestation', query: 'DeforestationEvent', domain: 'ecology' },
  { label: 'Displacement', query: 'DisplacementEvent', domain: 'population' },
  { label: 'Food Price Stress', query: 'FoodPriceEvent', domain: 'economy' },
  { label: 'Conflict Events', query: 'ConflictEvent', domain: 'infrastructure' },
  { label: 'Malaria', query: 'MalariaOutbreak', domain: 'disease' },
  { label: 'Wildfire', query: 'WildfireEvent', domain: 'ecology' },
]

const DOMAIN_COLORS: Record<string, string> = {
  climate: '#00b4d8',
  disease: '#ef233c',
  economy: '#f4a261',
  ecology: '#52b788',
  population: '#a8dadc',
  infrastructure: '#c77dff',
}

export default function ConceptSearch() {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const setSelectedNodeId = useGraphStore((state) => state.setSelectedNodeId)
  const setSelectedEdgeId = useGraphStore((state) => state.setSelectedEdgeId)
  const setSearchQuery = useGraphStore((state) => state.setSearchQuery)
  const setCascadeType = useGraphStore((state) => state.setCascadeType)
  const clearPath = useGraphStore((state) => state.clearPath)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleQuickConcept(concept: { query: string; label: string }) {
    clearPath()
    setSelectedEdgeId(undefined)
    setSelectedNodeId(undefined)
    setCascadeType('')
    setSearchQuery(concept.label)
    setInput(concept.label)
    setOpen(false)
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (input.trim().length >= 2) {
      clearPath()
      setCascadeType('')
      setSelectedEdgeId(undefined)
      setSelectedNodeId(undefined)
      setSearchQuery(input.trim())
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#4db8ff]">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <input
          id="concept-search-input"
          type="text"
          value={input}
          onChange={(event) => {
            setInput(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search any concept - dengue, rainfall, displacement, conflict..."
          className="w-full rounded-xl border border-[#1f2a3b] bg-[#0f1b2d] py-3 pl-11 pr-24 text-sm text-[#e6edf7] placeholder:text-[#4a6a8a] focus:border-[#4db8ff] focus:outline-none focus:ring-1 focus:ring-[#4db8ff]/30"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-[#193254] px-4 py-1.5 text-xs font-semibold text-[#eaf2ff] transition-colors hover:bg-[#22426a]"
        >
          {'Explore ->'}
        </button>
      </form>
      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-[#1f2a3b] bg-[#0d1828] shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
          {input.length < 2 ? (
            <div className="p-3">
              <p className="mb-2 px-1 text-[10px] uppercase tracking-[0.2em] text-[#5a7090]">Quick concepts</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_CONCEPTS.map((concept) => (
                  <button
                    key={concept.query}
                    type="button"
                    onClick={() => handleQuickConcept(concept)}
                    className="rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-[#142236]"
                    style={{
                      borderColor: DOMAIN_COLORS[concept.domain] + '55',
                      color: DOMAIN_COLORS[concept.domain],
                    }}
                  >
                    {concept.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-[#5a7090]">
              Press Enter or use Explore to search the graph. Suggestions are limited to quick concepts.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
