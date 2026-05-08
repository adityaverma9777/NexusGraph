import { useMapLayers } from '../../hooks/useMapLayers'
import { useMapStore } from '../../store/mapStore'

export default function LayerSelector() {
  const { activeLayers, layerEntries, isFetching } = useMapLayers()
  const toggleLayer = useMapStore((state) => state.toggleLayer)

  return (
    <aside className="rounded-2xl border border-[#1f2a3b] bg-[#0f1724]/95 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
      <p className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">Layers</p>
      <h3 className="mt-1 text-lg font-semibold text-[#f3f7ff]">Active overlays</h3>
      {isFetching && <p className="mt-2 text-xs text-[#91a5c2]">Refreshing layer catalog...</p>}
      <ul className="mt-4 space-y-3 text-sm">
        {layerEntries.map((layer) => (
          <li key={layer.id} className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={activeLayers.includes(layer.id)}
                onChange={() => toggleLayer(layer.id)}
                className="rounded border-[#2b3a52] bg-[#0f1b2d]"
              />
              <span className="text-[#dce8f9]">{layer.label}</span>
            </label>
            <div
              className="h-4 w-4 rounded"
              style={{ backgroundColor: layer.color }}
            />
          </li>
        ))}
      </ul>
    </aside>
  )
}
