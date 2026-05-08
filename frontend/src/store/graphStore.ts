import { create } from 'zustand'

type GraphState = {
  currentDate: string
  setCurrentDate: (date: string) => void
  selectedNodeId?: string
  selectedEdgeId?: string
  setSelectedNodeId: (nodeId?: string) => void
  setSelectedEdgeId: (edgeId?: string) => void
  layout: 'default' | 'hierarchical' | 'radial'
  setLayout: (layout: 'default' | 'hierarchical' | 'radial') => void
  minConfidence: number
  setMinConfidence: (value: number) => void
  searchTerm: string
  setSearchTerm: (value: string) => void
}

export const useGraphStore = create<GraphState>((set) => ({
  currentDate: '2024-06',
  setCurrentDate: (date) => set({ currentDate: date }),
  selectedNodeId: 'climate_rainfall_kerala_2024_w24',
  selectedEdgeId: 'edge_rainfall_mosquito',
  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),
  setSelectedEdgeId: (edgeId) => set({ selectedEdgeId: edgeId }),
  layout: 'default',
  setLayout: (layout) => set({ layout }),
  minConfidence: 0.5,
  setMinConfidence: (value) => set({ minConfidence: value }),
  searchTerm: '',
  setSearchTerm: (value) => set({ searchTerm: value }),
}))
