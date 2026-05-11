import { create } from 'zustand'

type Layout = 'default' | 'hierarchical' | 'radial'

type GraphStore = {
  selectedNodeId: string | undefined
  selectedEdgeId: string | undefined
  layout: Layout
  minConfidence: number
  currentDate: string
  cascadeType: string
  searchQuery: string
  pathFromId: string
  pathToId: string
  setSelectedNodeId: (id: string | undefined) => void
  setSelectedEdgeId: (id: string | undefined) => void
  setLayout: (layout: Layout) => void
  setMinConfidence: (value: number) => void
  setCurrentDate: (date: string) => void
  setCascadeType: (type: string) => void
  setSearchQuery: (q: string) => void
  setPathIds: (fromId: string, toId: string) => void
  clearPath: () => void
}

export const useGraphStore = create<GraphStore>((set) => ({
  selectedNodeId: undefined,
  selectedEdgeId: undefined,
  layout: 'radial',
  minConfidence: 0.4,
  currentDate: new Date().toISOString().slice(0, 10),
  cascadeType: '',
  searchQuery: '',
  pathFromId: '',
  pathToId: '',
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id }),
  setLayout: (layout) => set({ layout }),
  setMinConfidence: (value) => set({ minConfidence: value }),
  setCurrentDate: (date) => set({ currentDate: date }),
  setCascadeType: (type) => set({ cascadeType: type }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setPathIds: (fromId, toId) => set({ pathFromId: fromId, pathToId: toId }),
  clearPath: () => set({ pathFromId: '', pathToId: '' }),
}))
