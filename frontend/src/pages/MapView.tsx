import ClusterLayer from '../components/map/ClusterLayer'
import HeatmapLayer from '../components/map/HeatmapLayer'
import IntelligenceMap from '../components/map/IntelligenceMap'
import LayerSelector from '../components/map/LayerSelector'

export default function MapView() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">Geospatial</p>
          <h2 className="text-2xl font-semibold text-[#f3f7ff]">Multi-layer intelligence map</h2>
        </div>
        <IntelligenceMap>
          <HeatmapLayer />
          <ClusterLayer />
        </IntelligenceMap>
      </div>
      <LayerSelector />
    </div>
  )
}
