import { useMemo } from 'react'
import { useGraph } from '../../hooks/useGraph'
import { useGraphStore } from '../../store/graphStore'
import type { GraphEdge, GraphNode } from '../../lib/mockData'

type ChainStep = {
  node: GraphNode
  via?: GraphEdge
  depth: number
}

function buildAdjacency(edges: GraphEdge[]) {
  const outgoing = new Map<string, GraphEdge[]>()
  for (const edge of edges) {
    const list = outgoing.get(edge.source) ?? []
    list.push(edge)
    outgoing.set(edge.source, list)
  }
  for (const list of outgoing.values()) {
    list.sort((a, b) => b.confidence - a.confidence)
  }
  return outgoing
}

function scoreNode(node: GraphNode, edge?: GraphEdge) {
  const edgeScore = edge ? edge.confidence * 100 : 0
  const severityScore = node.severity * 10
  return edgeScore + severityScore
}

export default function ImpactChain() {
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId)
  const selectedEdgeId = useGraphStore((state) => state.selectedEdgeId)
  const { nodes, edges } = useGraph()

  const chain = useMemo(() => {
    try {
      if (!nodes || !nodes.length) return { root: undefined as GraphNode | undefined, steps: [] as ChainStep[], domains: new Map<string, number>() }

      const selectedEdge = edges.find((edge) => edge?.id === selectedEdgeId)
      const rootId = selectedEdge?.source ?? selectedNodeId ?? nodes.find((node) => node?.domain !== 'meta')?.id ?? nodes[0]?.id
      const root = nodes.find((node) => node?.id === rootId)
      if (!root) return { root: undefined as GraphNode | undefined, steps: [], domains: new Map<string, number>() }

    const outgoing = buildAdjacency(edges)
    const steps: ChainStep[] = [{ node: root, depth: 0 }]
    const domains = new Map<string, number>()
    domains.set(root.domain, 1)

    const visited = new Set<string>([root.id])
    let frontier: Array<{ node: GraphNode; depth: number }> = [{ node: root, depth: 0 }]

    for (let depth = 1; depth <= 3; depth += 1) {
      const nextFrontier: Array<{ node: GraphNode; depth: number }> = []
      for (const item of frontier) {
        const candidates = (outgoing.get(item.node.id) ?? []).slice(0, depth === 1 ? 4 : 2)
        for (const edge of candidates) {
          const target = nodes.find((node) => node.id === edge.target)
          if (!target || visited.has(target.id)) continue
          visited.add(target.id)
          steps.push({ node: target, via: edge, depth })
          domains.set(target.domain, (domains.get(target.domain) ?? 0) + 1)
          nextFrontier.push({ node: target, depth })
          if (steps.length >= 8) break
        }
        if (steps.length >= 8) break
      }
      if (!nextFrontier.length || steps.length >= 8) break
      frontier = nextFrontier
    }

      steps.sort((a, b) => {
        if (a.depth !== b.depth) return a.depth - b.depth
        return scoreNode(b.node, b.via) - scoreNode(a.node, a.via)
      })

      return { root, steps, domains }
    } catch (error) {
      console.warn('Error building impact chain:', error)
      return { root: undefined as GraphNode | undefined, steps: [] as ChainStep[], domains: new Map<string, number>() }
    }
  }, [edges, nodes, selectedEdgeId, selectedNodeId])

  if (!chain.root) {
    return null
  }

  const topDomain = Array.from(chain.domains.entries()).sort((a, b) => b[1] - a[1])[0]

  return (
    <section className="space-y-4 rounded-2xl border border-[#1f2a3b] bg-[#0f1724]/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">Impact Chain</p>
          <h3 className="text-xl font-semibold text-[#f3f7ff]">Likely downstream pipeline from the selected graph item</h3>
        </div>
        <p className="text-xs text-[#91a5c2]">
          Root: <span className="font-semibold text-[#dce8f9]">{chain.root.label}</span>
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {chain.steps.map((step, index) => (
          <div key={`${step.node.id}-${index}`} className="rounded-xl border border-[#1f2a3b] bg-[#0a1420] p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#7f93b1]">Stage {step.depth + 1}</p>
              {step.via && (
                <span className="rounded-full border border-[#2b3a52] bg-[#101b2c] px-2 py-0.5 text-[10px] text-[#c6d7ec]">
                  {step.via.relationship}
                </span>
              )}
            </div>
            <h4 className="mt-2 text-sm font-semibold text-[#eaf2ff]">{step.node.label}</h4>
            <p className="mt-1 text-xs text-[#91a5c2]">{step.node.entityType} · {step.node.domain}</p>
            <p className="mt-2 text-xs text-[#7090b0]">Severity {step.node.severity.toFixed(1)} / 10</p>
            {step.via && (
              <p className="mt-2 text-xs text-[#8ea3c1]">
                Confidence {(step.via.confidence * 100).toFixed(0)}% · Lag {step.via.lagWeeks} weeks
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-[#1f2a3b] bg-[#0a1220] p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">Dominant Downstream Domain</p>
          <p className="mt-2 text-lg font-semibold text-[#f3f7ff]">{topDomain?.[0] ?? 'Unknown'}</p>
          <p className="mt-1 text-xs text-[#91a5c2]">{topDomain ? `${topDomain[1]} connected nodes in this analysis window` : 'No downstream nodes found.'}</p>
        </div>
        <div className="rounded-xl border border-[#1f2a3b] bg-[#0a1220] p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-[#7f93b1]">Cascade Summary</p>
          <p className="mt-2 text-sm text-[#c6d7ec]">
            This chain is built from the highest-confidence outgoing links around your selection, so it approximates the most likely ripple path without requiring extra clicks.
          </p>
        </div>
      </div>
    </section>
  )
}