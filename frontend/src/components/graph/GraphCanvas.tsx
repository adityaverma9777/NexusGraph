import CytoscapeComponent from 'react-cytoscapejs'
import { useEffect, useMemo, useRef } from 'react'
import type { Core, EventObject } from 'cytoscape'
import { cytoscapeLayouts, cytoscapeStyles } from '../../lib/cytoscapeConfig'
import { domainColors } from '../../lib/mockData'
import { useGraph } from '../../hooks/useGraph'
import { useGraphStore } from '../../store/graphStore'
import { GraphSkeleton } from '../ui/Skeleton'

export default function GraphCanvas() {
  const { nodes, edges, isLoading, hasQuery } = useGraph()
  const layoutKey = useGraphStore((state) => state.layout)
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId)
  const selectedEdgeId = useGraphStore((state) => state.selectedEdgeId)
  const setSelectedNodeId = useGraphStore((state) => state.setSelectedNodeId)
  const setSelectedEdgeId = useGraphStore((state) => state.setSelectedEdgeId)
  const cyRef = useRef<Core | null>(null)

  function zoomToCenter(factor: number) {
    const cy = cyRef.current
    if (!cy) return
    const container = cy.container()
    if (!container) return
    const { width, height } = container.getBoundingClientRect()
    cy.zoom({
      level: cy.zoom() * factor,
      renderedPosition: { x: width / 2, y: height / 2 },
    })
  }

  function handleZoomIn() {
    zoomToCenter(1.2)
  }

  function handleZoomOut() {
    zoomToCenter(0.8)
  }

  function getNodeLabel(label: string) {
    return label.length > 28 ? `${label.slice(0, 25)}...` : label
  }

  const elements = useMemo(
    () => [
      ...nodes.map((node) => ({
        data: {
          id: node.id,
          label: getNodeLabel(node.label),
          domain: node.domain,
          entityType: node.entityType,
          color: domainColors[node.domain],
          size: node.domain === 'meta' ? 26 : 42 + node.severity * 2,
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

  const graphSignature = useMemo(
    () => `${layoutKey}:${nodes.map((node) => node.id).join('|')}::${edges.map((edge) => edge.id).join('|')}`,
    [layoutKey, nodes, edges],
  )
  const layoutConfig = cytoscapeLayouts[layoutKey] ?? cytoscapeLayouts.default

  useEffect(() => {
    if (!nodes.length) {
      return
    }
    const selectedNodeStillVisible = selectedNodeId ? nodes.some((node) => node.id === selectedNodeId) : false
    if (!selectedNodeStillVisible) {
      const nextNode =
        nodes.find((node) => node.domain === 'meta' && ['Country', 'CountryProfile', 'AdminArea', 'AdminSubdivision'].includes(node.entityType)) ??
        nodes.find((node) => node.domain !== 'meta') ??
        nodes[0]
      setSelectedNodeId(nextNode?.id)
    }
  }, [nodes, selectedNodeId, setSelectedNodeId])

  useEffect(() => {
    if (!selectedEdgeId) {
      return
    }
    const selectedEdgeStillVisible = edges.some((edge) => edge.id === selectedEdgeId)
    if (!selectedEdgeStillVisible) {
      setSelectedEdgeId(undefined)
    }
  }, [edges, selectedEdgeId, setSelectedEdgeId])

  if (!hasQuery) {
    return (
      <div className="flex h-[calc(100vh-73px)] w-full flex-col items-center justify-center gap-5 bg-[#000000]">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#1a1a1a] bg-[#0a0a0a]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#ffffff]">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[#dddddd]">Start exploring</p>
          <p className="mt-1 max-w-xs text-xs text-[#999999]">
            Search for a concept above — dengue, rainfall, conflict, deforestation — and the graph will expand from there.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 px-8">
          {['Dengue', 'Rainfall', 'Displacement', 'Deforestation'].map((hint) => (
            <span key={hint} className="rounded-full border border-[#111111] bg-[#0a0a0a] px-3 py-1 text-xs text-[#999999]">
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
      <div className="flex h-[calc(100vh-73px)] w-full flex-col items-center justify-center gap-3 bg-[#000000]">
        <p className="text-sm text-[#dddddd]">No nodes found</p>
        <p className="text-xs text-[#999999]">Try a different search term or concept</p>
      </div>
    )
  }

  return (
    <div className="relative mx-4 mt-4 h-[calc(100vh-105px)] w-[calc(100%-32px)] overflow-hidden rounded-xl border border-[#ffffff]/20 bg-[#000000]">
      <div className="absolute right-6 top-6 z-10 flex flex-col gap-2 rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-1 shadow-lg">
        <button onClick={handleZoomIn} className="flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-[#111111] text-[#f0f0f0]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
        <div className="h-px w-full bg-[#1a1a1a]"></div>
        <button onClick={handleZoomOut} className="flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-[#111111] text-[#f0f0f0]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
      </div>
      <CytoscapeComponent
        key={graphSignature}
        elements={elements}
        style={{ width: '100%', height: '100%' }}
        layout={layoutConfig}
        stylesheet={cytoscapeStyles}
        minZoom={0.01}
        maxZoom={5}
        zoomingEnabled={true}
        userZoomingEnabled={true}
        wheelSensitivity={0.2}
        panningEnabled={true}
        userPanningEnabled={true}
        cy={(cy: Core) => {
          cyRef.current = cy
          cy.on('tap', 'node', (event: EventObject) => {
            setSelectedNodeId(event.target.data('id'))
            setSelectedEdgeId(undefined)
          })
          cy.on('tap', 'edge', (event: EventObject) => {
            setSelectedEdgeId(event.target.data('id'))
          })
          cy.on('tap', (event: EventObject) => {
            if (event.target === cy) {
              setSelectedEdgeId(undefined)
            }
          })
          cy.ready(() => {
            cy.fit(undefined, 80)
            cy.center()
          })
          cy.on('layoutstop', () => {
            cy.fit(undefined, 80)
            cy.center()
          })
          cy.on('scrollzoom', () => {
            cy.center()
          })
        }}
      />
    </div>
  )
}
