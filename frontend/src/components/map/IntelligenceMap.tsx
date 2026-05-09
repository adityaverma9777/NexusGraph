import type { ReactNode } from 'react'
import { useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { TILE_PROVIDERS } from '../../lib/leafletConfig'
import { useMapStore } from '../../store/mapStore'
import { useGraphStore } from '../../store/graphStore'
import { apiClient } from '../../lib/api'
import MapPopup from './MapPopup'

const iconProto = L.Icon.Default.prototype as unknown as { _getIconUrl?: string }
delete iconProto._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

type ClickedPoint = { lat: number; lon: number }

type SpatialEntity = {
  id: string
  entity_type: string
  domain: string
  lat: number
  lon: number
  severity: number
  source: string
}

type DisplayMarker = {
  id: string
  position: [number, number]
  label?: string
  domain?: string
  entityType?: string
  severity?: number
  isGraphNode?: boolean
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(event) {
      onClick(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

export default function IntelligenceMap({ children }: { children?: ReactNode }) {
  const [clickedPoint, setClickedPoint] = useState<ClickedPoint | null>(null)
  const tileProvider = useMapStore((state) => state.tileProvider)
  const currentDate = useGraphStore((state) => state.currentDate)
  const setSelectedNodeId = useGraphStore((state) => state.setSelectedNodeId)
  const setSearchQuery = useGraphStore((state) => state.setSearchQuery)
  const setCascadeType = useGraphStore((state) => state.setCascadeType)
  const clearPath = useGraphStore((state) => state.clearPath)
  const navigate = useNavigate()

  const { data: spatialData, isLoading: spatialLoading } = useQuery({
    queryKey: ['spatial', clickedPoint?.lat, clickedPoint?.lon, currentDate],
    enabled: Boolean(clickedPoint),
    queryFn: async () => {
      if (!clickedPoint) return null
      return apiClient(
        `/api/map/spatial-query?lat=${clickedPoint.lat}&lon=${clickedPoint.lon}&radius_km=50&as_of=${currentDate}`,
      )
    },
    staleTime: 120_000,
  })

  const handleMapClick = useCallback((lat: number, lon: number) => {
    setClickedPoint({ lat, lon })
  }, [])

  function handleOpenInGraph(entityId: string) {
    clearPath()
    setCascadeType('')
    setSearchQuery('')
    setSelectedNodeId(entityId)
    navigate('/')
  }

  const spatialMarkers: DisplayMarker[] = ((spatialData as { entities?: SpatialEntity[] } | null)?.entities ?? []).map((entity) => ({
    id: entity.id,
    position: [entity.lat, entity.lon] as [number, number],
    label: entity.entity_type.replace(/([A-Z])/g, ' $1').trim(),
    domain: entity.domain,
    entityType: entity.entity_type,
    severity: entity.severity,
    isGraphNode: true,
  }))

  return (
    <div className="relative h-[520px] overflow-hidden rounded-2xl border border-[#1f2a3b] shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
      {clickedPoint && spatialLoading && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-[500] -translate-x-1/2 rounded-full border border-[#1f2a3b] bg-[#0d1828]/90 px-4 py-1.5 text-xs text-[#4db8ff]">
          Querying 50km radius...
        </div>
      )}
      {clickedPoint && !spatialLoading && spatialData && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-[500] -translate-x-1/2 rounded-full border border-[#1f2a3b] bg-[#0d1828]/90 px-4 py-1.5 text-xs text-[#52b788]">
          {(spatialData as { count?: number }).count ?? 0} entities within 50km
        </div>
      )}
      <MapContainer center={[20, 78]} zoom={4} scrollWheelZoom className="h-full w-full" style={{ zIndex: 0 }}>
        <TileLayer url={TILE_PROVIDERS[tileProvider]} attribution="" />
        <MapClickHandler onClick={handleMapClick} />
        {spatialMarkers.map((marker) => (
          <Marker key={marker.id} position={marker.position}>
            <Popup>
              <MapPopup
                title={marker.label ?? 'Location'}
                domain={marker.domain}
                entityType={marker.entityType}
                severity={marker.severity}
                isGraphNode={marker.isGraphNode}
                onOpenInGraph={() => handleOpenInGraph(marker.id)}
              />
            </Popup>
          </Marker>
        ))}
        {children}
      </MapContainer>
    </div>
  )
}
