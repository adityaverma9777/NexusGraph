import { NavLink, Route, Routes } from 'react-router-dom'
import DataRegistry from './pages/DataRegistry'
import Home from './pages/Home'
import { useGraphStore } from './store/graphStore'
import ConceptSearch from './components/graph/ConceptSearch'
const navItems = [
  { label: 'Graph', to: '/' },
  { label: 'Datasets', to: '/datasets' },
]
import ConnectionGuard from './components/ui/ConnectionGuard'
import DeviceGuard from './components/ui/DeviceGuard'

function App() {
  const layout = useGraphStore((state) => state.layout)
  const setLayout = useGraphStore((state) => state.setLayout)
  return (
    <DeviceGuard>
      <ConnectionGuard>
        <div className="min-h-screen bg-transparent text-[#f0f0f0]">
        <header className="sticky top-0 z-50 border-b border-[#1a1a1a] bg-[#0a0a0a]/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between px-8 py-4">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] uppercase tracking-[0.32em] text-[#ffffff]">NexusGraph</p>
                  <span className="rounded-md border border-[#333333] bg-[#111111] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#aaaaaa]">Pre-Beta</span>
                </div>
                <h1 className="text-xl font-semibold tracking-tight text-[#ffffff]">Create Insights from Data</h1>
              </div>
              <div className="hidden flex-1 items-center gap-4 pl-8 sm:flex">
                <div className="w-[400px]">
                  <ConceptSearch />
                </div>
                <label className="flex items-center gap-2 text-xs text-[#bbbbbb]">
                  Layout
                  <select
                    value={layout}
                    onChange={(event) => setLayout(event.target.value as 'default' | 'hierarchical' | 'radial')}
                    className="rounded-full border border-[#222222] bg-[#0a0a0a] px-3 py-1.5 text-xs text-[#f0f0f0] outline-none"
                  >
                    <option value="default">Force</option>
                    <option value="hierarchical">Hierarchy</option>
                    <option value="radial">Radial</option>
                  </select>
                </label>
                <div className="flex items-center gap-4 border-l border-[#1a1a1a] pl-4 text-[11px] font-medium text-[#bbbbbb]">
                  <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-[#ffffff]" />126 Datasets</span>
                  <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-[#ffffff]" />1,04,30,692 Rows</span>
                  <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-[#ffffff]" />1,27,407 Nodes</span>
                  <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-[#ffffff]" />4,01,090 Relationships</span>
                </div>
              </div>
            </div>
            <nav className="flex items-center gap-1 rounded-full border border-[#1a1a1a] bg-[#0a0a0a] p-1 text-sm font-medium">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 transition-colors text-xs ${isActive
                      ? 'bg-[#111111] text-[#ffffff] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]'
                      : 'text-[#bbbbbb] hover:bg-[#111111] hover:text-[#ffffff]'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-[1440px]">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/datasets" element={<DataRegistry />} />
          </Routes>
        </main>
      </div>
      </ConnectionGuard>
    </DeviceGuard>
  )
}
export default App
