import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

export default function ClusterLayer() {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    // Cluster marker groups could be added here
    // For now, this layer is reserved for future clustering logic
  }, [map])

  return null
}
