import CytoscapeComponent from 'react-cytoscapejs'
import { useMemo } from 'react'
import type { Core, EventObject } from 'cytoscape'
import { cytoscapeLayouts, cytoscapeStyles } from '../../lib/cytoscapeConfig'
import { domainColors } from '../../lib/mockData'
import { useGraph } from '../../hooks/useGraph'
import { useGraphStore } from '../../store/graphStore'

export default function GraphCanvas() {
  const { nodes, edges } = useGraph()
  const layoutKey = useGraphStore((state) => state.layout)
  const setSelectedNodeId = useGraphStore((state) => state.setSelectedNodeId)
  const setSelectedEdgeId = useGraphStore((state) => state.setSelectedEdgeId)

  const elements = useMemo(
    () => [
      ...nodes.map((node) => ({
        data: {
          id: node.id,
          label: node.label,
          domain: node.domain,
          color: domainColors[node.domain],
          size: 42 + node.severity * 2,
        },
      })),
      ...edges.map((edge) => ({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          relationship: edge.relationship,
          edgeColor: '#6a6374',
          weight: Math.max(1, edge.confidence * 4),
          confidence: edge.confidence,
        },
      })),
    ],
    [nodes, edges],
  )

  return (
    <div className="h-[420px] overflow-hidden rounded-2xl border border-[#1f2a3b] bg-[#0a1220]">
      <CytoscapeComponent
        elements={elements}
        style={{ width: '100%', height: '100%' }}
        layout={cytoscapeLayouts[layoutKey]}
        stylesheet={cytoscapeStyles}
        minZoom={0.2}
        maxZoom={2}
        cy={(cy: Core) => {
          cy.on('tap', 'node', (event: EventObject) => {
            setSelectedNodeId(event.target.data('id'))
          })
          cy.on('tap', 'edge', (event: EventObject) => {
            setSelectedEdgeId(event.target.data('id'))
          })
          cy.on('tap', (event: EventObject) => {
            if (event.target === cy) {
              setSelectedEdgeId(undefined)
            }
          })
        }}
      />
    </div>
  )
}
