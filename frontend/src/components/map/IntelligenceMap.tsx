import type { ReactNode } from 'react'
import { MapContainer, TileLayer, Popup, Marker } from 'react-leaflet'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'
import { TILE_PROVIDERS } from '../../lib/leafletConfig'
import { mapMarkers, graphNodes } from '../../lib/mockData'
import { useMapOverlays } from '../../hooks/useMapOverlays'
import { useMapStore } from '../../store/mapStore'
import { useGraphStore } from '../../store/graphStore'
import MapPopup from './MapPopup'

type DisplayMarker = {
  id: string
  position: [number, number]
  label?: string
  domain?: string
  entityType?: string
  severity?: number
  isGraphNode?: boolean
}

const iconDefaultPrototype = L.Icon.Default.prototype as unknown as { _getIconUrl?: string }
delete iconDefaultPrototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

type IntelligenceMapProps = {
  children?: ReactNode
}

export default function IntelligenceMap({ children }: IntelligenceMapProps) {
  const center: [number, number] = [20, 78]
  const { overlays } = useMapOverlays()
  const tileProvider = useMapStore((state) => state.tileProvider)
  const setSelectedNodeId = useGraphStore((state) => state.setSelectedNodeId)
  const navigate = useNavigate()

  const enrichedMarkers: DisplayMarker[] =
    overlays && overlays.length
      ? overlays
      : [
          ...graphNodes
            .filter((n) => n.lat !== undefined && n.lon !== undefined)
            .map((n) => ({
              id: n.id,
              position: [n.lat!, n.lon!] as [number, number],
              label: n.label,
              domain: n.domain,
              entityType: n.entityType,
              severity: n.severity,
              isGraphNode: true,
            })),
          ...mapMarkers
            .filter((m) => !graphNodes.find((n) => n.id === m.id))
            .map((m) => ({ id: m.id, position: m.position, label: m.label })),
        ]

  function handleNodeSelect(marker: DisplayMarker) {
    if (!marker.isGraphNode) return
    setSelectedNodeId(marker.id)
    navigate('/')
  }

  return (
    <div className="relative h-[520px] overflow-hidden rounded-2xl border border-[#1f2a3b] shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
      <MapContainer
        center={center}
        zoom={4}
        scrollWheelZoom
        className="h-full w-full"
        style={{ zIndex: 0 }}
      >
        <TileLayer url={TILE_PROVIDERS[tileProvider]} attribution="" />
        {enrichedMarkers.map((marker) => (
          <Marker key={marker.id} position={marker.position}>
            <Popup>
              <MapPopup
                title={marker.label ?? 'Location'}
                domain={marker.domain}
                entityType={marker.entityType}
                severity={marker.severity}
                isGraphNode={marker.isGraphNode}
                onOpenInGraph={() => handleNodeSelect(marker)}
              />
            </Popup>
          </Marker>
        ))}
        {children}
      </MapContainer>
    </div>
  )
}
