import { useState } from 'react'
import { useGraphStore } from '../../store/graphStore'

export default function GraphControls() {
  const layout = useGraphStore((state) => state.layout)
  const minConfidence = useGraphStore((state) => state.minConfidence)
  const setLayout = useGraphStore((state) => state.setLayout)
  const setMinConfidence = useGraphStore((state) => state.setMinConfidence)
  const setSelectedNodeId = useGraphStore((state) => state.setSelectedNodeId)
  const setSelectedEdgeId = useGraphStore((state) => state.setSelectedEdgeId)
  const setCascadeType = useGraphStore((state) => state.setCascadeType)
  const setSearchQuery = useGraphStore((state) => state.setSearchQuery)
  const setPathIds = useGraphStore((state) => state.setPathIds)
  const clearPath = useGraphStore((state) => state.clearPath)

  const [cascadeInput, setCascadeInput] = useState('')
  const [pathFrom, setPathFrom] = useState('')
  const [pathTo, setPathTo] = useState('')

  function runCascade() {
    if (!cascadeInput.trim()) return
    clearPath()
    setSelectedNodeId(undefined)
    setSelectedEdgeId(undefined)
    setCascadeType(cascadeInput.trim())
    setSearchQuery('')
  }

  function clearAll() {
    setCascadeType('')
    setSearchQuery('')
    setSelectedNodeId(undefined)
    setSelectedEdgeId(undefined)
    clearPath()
    setCascadeInput('')
    setPathFrom('')
    setPathTo('')
  }

  function findPath() {
    const from = pathFrom.trim()
    const to = pathTo.trim()
    if (!from || !to) return
    setCascadeType('')
    setSearchQuery('')
    setPathIds(from, to)
    setSelectedEdgeId(undefined)
    setSelectedNodeId(from)
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-[#91a5c2]">
      <label className="flex items-center gap-2">
        Layout
        <select
          value={layout}
          onChange={(e) => setLayout(e.target.value as 'default' | 'hierarchical' | 'radial')}
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
          onChange={(e) => setMinConfidence(Number(e.target.value))}
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
        <button
          type="button"
          onClick={runCascade}
          className="rounded bg-[#244a74] px-3 py-1 text-xs font-medium text-[#ebf5ff] hover:bg-[#2d5d92]"
        >
          Run cascade
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="rounded border border-[#2b3a52] bg-[#0f1b2d] px-3 py-1 text-xs text-[#c5d4ea] hover:bg-[#16253a]"
        >
          Clear
        </button>
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
        <button
          type="button"
          onClick={findPath}
          className="rounded bg-[#244a74] px-3 py-1 text-xs font-medium text-[#ebf5ff] hover:bg-[#2d5d92]"
        >
          Find path
        </button>
      </div>
    </div>
  )
}
