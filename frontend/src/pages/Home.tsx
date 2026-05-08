import ConceptSearch from '../components/graph/ConceptSearch'
import EdgePanel from '../components/graph/EdgePanel'
import GraphCanvas from '../components/graph/GraphCanvas'
import GraphControls from '../components/graph/GraphControls'
import NodePanel from '../components/graph/NodePanel'

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-[#e0dcd4] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#6a6374]">Graph Explorer</p>
            <h2 className="text-2xl font-semibold">Multi-domain relationship canvas</h2>
          </div>
          <GraphControls />
        </div>
        <ConceptSearch />
        <GraphCanvas />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <NodePanel />
        <EdgePanel />
      </section>
    </div>
  )
}
