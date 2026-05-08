import { useGraphStore } from '../../store/graphStore'
import { useState } from 'react'
import { apiClient } from '../../lib/api'


export default function GraphControls() {
  const layout = useGraphStore((state) => state.layout)
  const setLayout = useGraphStore((state) => state.setLayout)
  const minConfidence = useGraphStore((state) => state.minConfidence)
  const setMinConfidence = useGraphStore((state) => state.setMinConfidence)
  const setSelectedNodeId = useGraphStore((state) => state.setSelectedNodeId)
  const setCascadeType = useGraphStore((state) => state.setCascadeType)

  const [cascadeInput, setCascadeInput] = useState('')
  const [pathFrom, setPathFrom] = useState('')
  const [pathTo, setPathTo] = useState('')

  async function runCascade() {
    if (!cascadeInput.trim()) return
    // Set cascadeType in store which triggers useGraph to fetch cascade endpoint
    setCascadeType(cascadeInput.trim())
  }

  function clearCascade() {
    setCascadeType(undefined)
  }

  async function findPath() {
    const from = pathFrom.trim()
    const to = pathTo.trim()
    if (!from || !to) return

    try {
      const payload = await apiClient(`/api/graph/path?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      // focus the UI on the 'from' node if present, otherwise fallback
      if (payload && typeof payload === 'object') {
        const data = (payload as any).data ?? payload
        const nodes = Array.isArray(data.nodes) ? data.nodes : data.nodes ?? []
        const firstId = nodes[0]?.id ?? from
        setSelectedNodeId(firstId)
      } else {
        setSelectedNodeId(from)
      }
    } catch (e) {
      // On failure, still set selected node to 'from' as fallback
      setSelectedNodeId(from)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-[#91a5c2]">
      <label className="flex items-center gap-2">
        Layout
        <select
          value={layout}
          onChange={(event) =>
            setLayout(event.target.value as 'default' | 'hierarchical' | 'radial')
          }
          className="rounded-full border border-[#2b3a52] bg-[#0f1b2d] px-3 py-1 text-xs text-[#e6edf7]"
        >
          <option value="default">Force</option>
          <option value="hierarchical">Hierarchy</option>
          <option value="radial">Radial</option>
        </select>
      </label>
      <label className="flex items-center gap-2">
        Min confidence
        <input
          type="range"
          min="0.1"
          max="0.9"
          step="0.05"
          value={minConfidence}
          onChange={(event) => setMinConfidence(Number(event.target.value))}
        />
        <span className="min-w-[32px] text-right text-[#d9e5f8]">{minConfidence.toFixed(2)}</span>
      </label>
      <div className="flex items-center gap-2">
        <input
          className="rounded border border-[#2b3a52] bg-[#0f1b2d] px-2 py-1 text-xs text-[#e6edf7] placeholder:text-[#6f86a7]"
          placeholder="Cascade type (e.g. RainfallAnomaly)"
          value={cascadeInput}
          onChange={(e) => setCascadeInput(e.target.value)}
        />
        <button onClick={runCascade} className="rounded bg-[#244a74] px-3 py-1 text-xs font-medium text-[#ebf5ff] hover:bg-[#2d5d92]">Run cascade</button>
        <button onClick={clearCascade} className="rounded border border-[#2b3a52] bg-[#0f1b2d] px-3 py-1 text-xs text-[#c5d4ea] hover:bg-[#16253a]">Clear</button>
      </div>
      <div className="flex items-center gap-2">
        <input
          className="rounded border border-[#2b3a52] bg-[#0f1b2d] px-2 py-1 text-xs text-[#e6edf7] placeholder:text-[#6f86a7]"
          placeholder="Path from id"
          value={pathFrom}
          onChange={(e) => setPathFrom(e.target.value)}
        />
        <input
          className="rounded border border-[#2b3a52] bg-[#0f1b2d] px-2 py-1 text-xs text-[#e6edf7] placeholder:text-[#6f86a7]"
          placeholder="Path to id"
          value={pathTo}
          onChange={(e) => setPathTo(e.target.value)}
        />
        <button onClick={findPath} className="rounded bg-[#244a74] px-3 py-1 text-xs font-medium text-[#ebf5ff] hover:bg-[#2d5d92]">Find path</button>
      </div>
    </div>
  )
}
