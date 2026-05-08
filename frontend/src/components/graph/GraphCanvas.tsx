import CytoscapeComponent from 'react-cytoscapejs'
import { useMemo } from 'react'
import type { Core, EventObject } from 'cytoscape'
import { cytoscapeLayouts, cytoscapeStyles } from '../../lib/cytoscapeConfig'
import { domainColors } from '../../lib/mockData'
import { useGraph } from '../../hooks/useGraph'
import { useGraphStore } from '../../store/graphStore'
import { GraphSkeleton } from '../ui/Skeleton'

export default function GraphCanvas() {
  const { nodes, edges, isLoading, hasQuery } = useGraph()
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

  if (!hasQuery) {
    return (
      <div className="flex h-[420px] flex-col items-center justify-center gap-5 rounded-2xl border border-[#1f2a3b] bg-[#0a1220]">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#1f2a3b] bg-[#0d1828]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#4db8ff]">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[#c6d7ec]">Start exploring</p>
          <p className="mt-1 max-w-xs text-xs text-[#5a7090]">
            Search for a concept above — dengue, rainfall, conflict, deforestation — and the graph will expand from there.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 px-8">
          {['Dengue', 'Rainfall', 'Displacement', 'Deforestation'].map((hint) => (
            <span key={hint} className="rounded-full border border-[#1a2a3d] bg-[#0d1828] px-3 py-1 text-xs text-[#5a7090]">
              {hint}
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <GraphSkeleton />
  }

  if (nodes.length === 0) {
    return (
      <div className="flex h-[420px] flex-col items-center justify-center gap-3 rounded-2xl border border-[#1f2a3b] bg-[#0a1220]">
        <p className="text-sm text-[#c6d7ec]">No nodes found</p>
        <p className="text-xs text-[#5a7090]">Try a different search term or concept</p>
      </div>
    )
  }

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
