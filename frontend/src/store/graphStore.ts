import { create } from 'zustand'

type Layout = 'default' | 'hierarchical' | 'radial'

type GraphStore = {
  selectedNodeId: string | undefined
  selectedEdgeId: string | undefined
  layout: Layout
  currentDate: string
  cascadeType: string
  searchQuery: string
  setSelectedNodeId: (id: string | undefined) => void
  setSelectedEdgeId: (id: string | undefined) => void
  setLayout: (layout: Layout) => void
  setCurrentDate: (date: string) => void
  setCascadeType: (type: string) => void
  setSearchQuery: (q: string) => void
}

export const useGraphStore = create<GraphStore>((set) => ({
  selectedNodeId: undefined,
  selectedEdgeId: undefined,
  layout: 'default',
  currentDate: new Date().toISOString().slice(0, 10),
  cascadeType: '',
  searchQuery: '',
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id }),
  setLayout: (layout) => set({ layout }),
  setCurrentDate: (date) => set({ currentDate: date }),
  setCascadeType: (type) => set({ cascadeType: type }),
  setSearchQuery: (q) => set({ searchQuery: q }),
}))
