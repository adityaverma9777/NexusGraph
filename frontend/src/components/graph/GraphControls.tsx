import { useGraphStore } from '../../store/graphStore'

export default function GraphControls() {
  const layout = useGraphStore((state) => state.layout)
  const setLayout = useGraphStore((state) => state.setLayout)
  const minConfidence = useGraphStore((state) => state.minConfidence)
  const setMinConfidence = useGraphStore((state) => state.setMinConfidence)

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-[#6a6374]">
      <label className="flex items-center gap-2">
        Layout
        <select
          value={layout}
          onChange={(event) =>
            setLayout(event.target.value as 'default' | 'hierarchical' | 'radial')
          }
          className="rounded-full border border-[#d6d0c7] bg-white px-3 py-1 text-xs"
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
        <span className="min-w-[32px] text-right">{minConfidence.toFixed(2)}</span>
      </label>
    </div>
  )
}
