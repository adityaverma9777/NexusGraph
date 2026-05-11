import ClusterLayer from '../components/map/ClusterLayer'
import HeatmapLayer from '../components/map/HeatmapLayer'
import IntelligenceMap from '../components/map/IntelligenceMap'
import LayerSelector from '../components/map/LayerSelector'
import { useMapStore } from '../store/mapStore'
import { MAP_LAYERS } from '../lib/leafletConfig'

export default function MapView() {
  const activeLayers = useMapStore((state) => state.activeLayers)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[#aaaaaa]">Geospatial Intelligence</p>
        <h2 className="text-2xl font-semibold text-[#ffffff]">Multi-layer intelligence map</h2>
        <p className="mt-1 text-sm text-[#bbbbbb]">
          Enable overlays on the right to see where climate, disease, conflict and ecological signals converge.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-3">
          <IntelligenceMap>
            <HeatmapLayer />
            <ClusterLayer />
          </IntelligenceMap>
          {activeLayers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeLayers.map((id) => {
                const layer = MAP_LAYERS[id as keyof typeof MAP_LAYERS]
                if (!layer) return null
                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 rounded-full border border-[#1a1a1a] bg-[#000000] px-3 py-1.5 text-xs"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: layer.color }}
                    />
                    <span className="text-[#dddddd]">{layer.label}</span>
                  </div>
                )
              })}
              <span className="rounded-full border border-[#1a1a1a] bg-[#000000] px-3 py-1.5 text-xs text-[#7090b0]">
                {activeLayers.length} active overlay{activeLayers.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Nodes', value: '8', sub: 'across 6 domains' },
              { label: 'Active Layers', value: String(activeLayers.length), sub: 'of 7 available' },
              { label: 'Data Sources', value: '39', sub: 'public APIs' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a]/95 p-4 text-center"
              >
                <p className="text-2xl font-bold text-[#ffffff]">{stat.value}</p>
                <p className="text-xs font-medium text-[#dddddd]">{stat.label}</p>
                <p className="text-[10px] text-[#999999]">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
        <LayerSelector />
      </div>
    </div>
  )
}
