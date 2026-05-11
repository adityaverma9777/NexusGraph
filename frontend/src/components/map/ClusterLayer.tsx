import { useState } from 'react'
import L from 'leaflet'
import { Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import MapPopup from './MapPopup'
import { useMapOverlays } from '../../hooks/useMapOverlays'
import type { MapOverlay } from '../../hooks/useMapOverlays'
import { useGraphStore } from '../../store/graphStore'
import { domainColors } from '../../lib/mockData'
import { MAP_LAYERS } from '../../lib/leafletConfig'


type OverlayCluster = {
  id: string
  position: [number, number]
  items: MapOverlay[]
}

function getCellSize(zoom: number) {
  if (zoom <= 3) return 96
  if (zoom <= 5) return 72
  if (zoom <= 7) return 56
  if (zoom <= 9) return 40
  return 28
}

function buildClusterIcon(count: number, color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:40px;height:40px;border-radius:9999px;background:${color};border:2px solid rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;color:#ffffff;font-weight:700;font-size:12px;box-shadow:0 10px 24px rgba(0,0,0,0.35);">${count}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -18],
  })
}

function buildClusters(items: MapOverlay[], map: L.Map, zoom: number) {
  const cellSize = getCellSize(zoom)
  const buckets = new Map<string, MapOverlay[]>()

  for (const item of items) {
    const point = map.latLngToContainerPoint(item.position)
    const key = `${Math.floor(point.x / cellSize)}:${Math.floor(point.y / cellSize)}`
    const bucket = buckets.get(key) ?? []
    bucket.push(item)
    buckets.set(key, bucket)
  }

  return Array.from(buckets.entries()).map(([key, bucket]) => {
    const lat = bucket.reduce((sum, item) => sum + item.position[0], 0) / bucket.length
    const lon = bucket.reduce((sum, item) => sum + item.position[1], 0) / bucket.length
    return {
      id: key,
      position: [lat, lon] as [number, number],
      items: bucket,
    }
  })
}

export default function ClusterLayer() {
  const map = useMap()
  const navigate = useNavigate()
  const { overlays } = useMapOverlays()
  const setSelectedNodeId = useGraphStore((state) => state.setSelectedNodeId)
  const setSearchQuery = useGraphStore((state) => state.setSearchQuery)
  const setCascadeType = useGraphStore((state) => state.setCascadeType)
  const clearPath = useGraphStore((state) => state.clearPath)
  const [, setViewportVersion] = useState(0)
  const [zoom, setZoom] = useState(map.getZoom())

  useMapEvents({
    moveend() {
      setViewportVersion((value) => value + 1)
    },
    zoomend() {
      setZoom(map.getZoom())
      setViewportVersion((value) => value + 1)
    },
  })

  const clusters: OverlayCluster[] = overlays.length ? buildClusters(overlays, map, zoom) : []

  if (!clusters.length) {
    return null
  }

  function openInGraph(item: MapOverlay) {
    clearPath()
    setCascadeType('')
    setSearchQuery('')
    setSelectedNodeId(item.id)
    navigate('/')
  }

  return (
    <>
      {clusters.map((cluster) => {
        if (cluster.items.length === 1) {
          const item = cluster.items[0]
          const layer = item.layerId ? MAP_LAYERS[item.layerId as keyof typeof MAP_LAYERS] : undefined
          const markerColor = layer?.color ?? domainColors[item.domain ?? 'unknown'] ?? domainColors.unknown

          return (
            <Marker key={item.id} position={item.position} icon={buildClusterIcon(1, markerColor)}>
              <Popup>
                <MapPopup
                  title={item.label ?? layer?.label ?? 'Location'}
                  domain={item.domain}
                  entityType={item.entityType}
                  severity={item.severity}
                  relationshipCount={item.relationshipCount}
                  relationships={item.relationships}
                  isGraphNode
                  onOpenInGraph={() => openInGraph(item)}
                />
              </Popup>
            </Marker>
          )
        }

        const leadLayerId = cluster.items.find((item) => item.layerId)?.layerId ?? cluster.items[0]?.layerId
        const leadLayer = leadLayerId ? MAP_LAYERS[leadLayerId as keyof typeof MAP_LAYERS] : undefined
        const leadDomain = cluster.items[0]?.domain ?? 'unknown'
        const clusterColor = leadLayer?.color ?? domainColors[leadDomain] ?? domainColors.unknown
        const sampleLabels = cluster.items
          .slice(0, 4)
          .map((item) => item.label ?? item.entityType ?? item.id)
          .join(', ')

        return (
          <Marker
            key={cluster.id}
            position={cluster.position}
            icon={buildClusterIcon(cluster.items.length, clusterColor)}
            eventHandlers={{
              click: () => {
                map.flyTo(cluster.position, Math.min(map.getZoom() + 2, 10), { duration: 0.5 })
              },
            }}
          >
            <Popup>
              <div className="min-w-[220px] space-y-2 text-sm">
                <p className="font-semibold text-[#ffffff]">
                  {cluster.items.length} overlay node{cluster.items.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-[#8aa0bf]">
                  {leadLayer?.label ?? cluster.items[0]?.entityType ?? 'Overlay cluster'}
                </p>
                <p className="text-xs text-[#8aa0bf]">
                  {cluster.items.reduce((sum, item) => sum + (item.relationshipCount ?? 0), 0)} connected edge
                  {cluster.items.reduce((sum, item) => sum + (item.relationshipCount ?? 0), 0) === 1 ? '' : 's'} across cluster
                </p>
                <p className="text-xs text-[#8aa0bf]">{sampleLabels}</p>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}
