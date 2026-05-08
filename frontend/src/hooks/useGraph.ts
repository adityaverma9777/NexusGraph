import { graphEdges, graphNodes } from '../lib/mockData'
import { useGraphStore } from '../store/graphStore'

export function useGraph() {
  const minConfidence = useGraphStore((state) => state.minConfidence)
  const searchTerm = useGraphStore((state) => state.searchTerm.toLowerCase())

  const nodes = graphNodes.filter((node) =>
    searchTerm ? node.label.toLowerCase().includes(searchTerm) : true,
  )

  const edges = graphEdges.filter((edge) => edge.confidence >= minConfidence)

  return { nodes, edges }
}
