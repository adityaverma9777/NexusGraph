import { create } from 'zustand'

const defaultLayers = ['climate_rainfall', 'disease_dengue']

type MapState = {
  activeLayers: string[]
  toggleLayer: (layerId: string) => void
  setActiveLayers: (layers: string[]) => void
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
}))
