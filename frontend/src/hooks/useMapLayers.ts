import { useState } from 'react'
import { MAP_LAYERS } from '../lib/leafletConfig'

export function useMapLayers() {
  const [activeLayers, setActiveLayers] = useState<string[]>([Object.keys(MAP_LAYERS)[0]])

  return { activeLayers, setActiveLayers }
}
