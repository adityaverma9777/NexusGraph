import { useMapLayers } from '../../hooks/useMapLayers'
import { useMapStore } from '../../store/mapStore'

const TILE_OPTIONS: Array<{ value: 'dark' | 'satellite' | 'terrain'; label: string }> = [
  { value: 'dark', label: 'Dark' },
  { value: 'satellite', label: 'Satellite' },
  { value: 'terrain', label: 'Terrain' },
]

export default function LayerSelector() {
  const { activeLayers, layerEntries, isFetching } = useMapLayers()
  const toggleLayer = useMapStore((state) => state.toggleLayer)
  const layerOpacity = useMapStore((state) => state.layerOpacity)
  const setLayerOpacity = useMapStore((state) => state.setLayerOpacity)
  const tileProvider = useMapStore((state) => state.tileProvider)
  const setTileProvider = useMapStore((state) => state.setTileProvider)

  return (
    <aside className="space-y-5 rounded-2xl border border-[#1f2a3b] bg-[#0f1724]/95 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">Map Style</p>
        <div className="mt-3 flex gap-2">
          {TILE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTileProvider(opt.value)}
              className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${
                tileProvider === opt.value
                  ? 'border-[#4e79ab] bg-[#193254] text-[#eaf2ff]'
                  : 'border-[#1f2a3b] text-[#91a5c2] hover:border-[#2f4564] hover:bg-[#14243a]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">Active Overlays</p>
        {isFetching && <p className="mt-2 text-xs text-[#91a5c2]">Refreshing layer catalog...</p>}
        <ul className="mt-3 space-y-4">
          {layerEntries.map((layer) => {
            const isActive = activeLayers.includes(layer.id)
            const opacity = layerOpacity[layer.id] ?? 0.8
            return (
              <li key={layer.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2.5">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => toggleLayer(layer.id)}
                        className="sr-only"
                      />
                      <div
                        className={`h-4 w-7 rounded-full border transition-colors ${
                          isActive ? 'border-current' : 'border-[#2b3a52] bg-[#0f1b2d]'
                        }`}
                        style={isActive ? { backgroundColor: layer.color + '33', borderColor: layer.color } : undefined}
                      >
                        <div
                          className={`mt-0.5 h-3 w-3 rounded-full transition-all ${
                            isActive ? 'translate-x-3.5' : 'translate-x-0.5'
                          }`}
                          style={{ backgroundColor: isActive ? layer.color : '#4a6080' }}
                        />
                      </div>
                    </div>
                    <span className={`text-sm ${isActive ? 'text-[#dce8f9]' : 'text-[#7090b0]'}`}>{layer.label}</span>
                  </label>
                  <div
                    className="h-3 w-3 rounded-full border border-white/10 shadow-sm"
                    style={{ backgroundColor: layer.color }}
                  />
                </div>
                {isActive && (
                  <div className="flex items-center gap-2 pl-9">
                    <span className="text-[10px] text-[#7f93b1]">Opacity</span>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={opacity}
                      onChange={(e) => setLayerOpacity(layer.id, Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="min-w-[28px] text-right text-[10px] text-[#c6d7ec]">
                      {Math.round(opacity * 100)}%
                    </span>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
      <div className="rounded-xl border border-[#1f2a3b] bg-[#0a1220] p-3 text-xs text-[#7f93b1]">
        <p className="font-semibold text-[#9ab0cd]">Tip</p>
        <p className="mt-1">Enable up to 4 layers to see spatial overlap zones — where multiple crises converge.</p>
      </div>
    </aside>
  )
}
