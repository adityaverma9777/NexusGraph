import type { ReactNode } from 'react'
import { MapContainer, TileLayer, Popup, Marker } from 'react-leaflet'
import L from 'leaflet'
import { TILE_PROVIDERS } from '../../lib/leafletConfig'
import { mapMarkers } from '../../lib/mockData'
import { useMapOverlays } from '../../hooks/useMapOverlays'
import MapPopup from './MapPopup'

type Marker = typeof mapMarkers[0]

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl
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

  return (
    <div className="relative h-[520px] overflow-hidden rounded-2xl border border-[#1f2a3b] shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
      <MapContainer
        center={center}
        zoom={4}
        scrollWheelZoom
        className="h-full w-full"
        style={{ zIndex: 0 }}
      >
        <TileLayer url={TILE_PROVIDERS.dark} attribution="" />
        {(overlays || mapMarkers).map((marker: any) => (
          <Marker key={marker.id} position={marker.position ?? marker[0]}>
            <Popup>
              <MapPopup title={marker.label ?? marker.name ?? 'Location'} />
            </Popup>
          </Marker>
        ))}
        {children}
      </MapContainer>
    </div>
  )
}
