import type { ReactNode } from 'react'
import { MapContainer, TileLayer, Popup, Marker } from 'react-leaflet'
import L from 'leaflet'
import { TILE_PROVIDERS } from '../../lib/leafletConfig'
import { mapMarkers } from '../../lib/mockData'

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

  return (
    <div className="relative h-[520px] overflow-hidden rounded-2xl border border-[#e0dcd4] shadow-sm">
      <MapContainer
        center={center}
        zoom={4}
        scrollWheelZoom
        className="h-full w-full"
        style={{ zIndex: 0 }}
      >
        <TileLayer url={TILE_PROVIDERS.dark} attribution="" />
        {mapMarkers.map((marker: Marker) => (
          <Marker key={marker.id} position={marker.position}>
            <Popup>{marker.label}</Popup>
          </Marker>
        ))}
        {children}
      </MapContainer>
    </div>
  )
}
