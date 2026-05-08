import { useMapLayers } from '../../hooks/useMapLayers'
import { useMapStore } from '../../store/mapStore'

export default function LayerSelector() {
  const { activeLayers, layerEntries, isFetching } = useMapLayers()
  const toggleLayer = useMapStore((state) => state.toggleLayer)

  return (
    <aside className="rounded-2xl border border-[#e0dcd4] bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-[#6a6374]">Layers</p>
      <h3 className="mt-1 text-lg font-semibold">Active overlays</h3>
      {isFetching && <p className="mt-2 text-xs text-[#6a6374]">Refreshing layer catalog...</p>}
      <ul className="mt-4 space-y-3 text-sm">
        {layerEntries.map((layer) => (
          <li key={layer.id} className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={activeLayers.includes(layer.id)}
                onChange={() => toggleLayer(layer.id)}
                className="rounded"
              />
              <span className="text-[#3c3741]">{layer.label}</span>
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
