import { create } from 'zustand'

const defaultLayers = ['climate_rainfall', 'disease_dengue']

type MapState = {
  activeLayers: string[]
  toggleLayer: (layerId: string) => void
  setActiveLayers: (layers: string[]) => void
  layerOpacity: Record<string, number>
  setLayerOpacity: (layerId: string, opacity: number) => void
  tileProvider: 'dark' | 'satellite' | 'terrain'
  setTileProvider: (provider: 'dark' | 'satellite' | 'terrain') => void
}

export const useMapStore = create<MapState>((set) => ({
  activeLayers: defaultLayers,
  toggleLayer: (layerId) =>
    set((state) => ({
      activeLayers: state.activeLayers.includes(layerId)
        ? state.activeLayers.filter((item) => item !== layerId)
        : [...state.activeLayers, layerId],
    })),
  setActiveLayers: (layers) => set({ activeLayers: layers }),
  layerOpacity: {},
  setLayerOpacity: (layerId, opacity) =>
    set((state) => ({ layerOpacity: { ...state.layerOpacity, [layerId]: opacity } })),
  tileProvider: 'dark',
  setTileProvider: (provider) => set({ tileProvider: provider }),
}))
