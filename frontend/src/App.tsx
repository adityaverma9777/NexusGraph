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
        <div className="min-h-screen bg-transparent text-[#e6edf7]">
        <header className="sticky top-0 z-50 border-b border-[#1f2a3b] bg-[#0c1422]/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between px-8 py-4">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.32em] text-[#4db8ff]">NexusGraph</p>
                <h1 className="text-xl font-semibold tracking-tight text-[#f3f7ff]">Create Insights from Data</h1>
              </div>
              <div className="hidden flex-1 items-center gap-4 pl-8 sm:flex">
                <div className="w-[400px]">
                  <ConceptSearch />
                </div>
                <label className="flex items-center gap-2 text-xs text-[#91a5c2]">
                  Layout
                  <select
                    value={layout}
                    onChange={(event) => setLayout(event.target.value as 'default' | 'hierarchical' | 'radial')}
                    className="rounded-full border border-[#2b3a52] bg-[#0f1b2d] px-3 py-1.5 text-xs text-[#e6edf7] outline-none"
                  >
                    <option value="default">Force</option>
                    <option value="hierarchical">Hierarchy</option>
                    <option value="radial">Radial</option>
                  </select>
                </label>
                <div className="flex items-center gap-4 border-l border-[#1f2a3b] pl-4 text-[11px] font-medium text-[#91a5c2]">
                  <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-[#4db8ff]" />126 Datasets</span>
                  <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-[#4db8ff]" />1,04,30,692 Rows</span>
                  <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-[#4db8ff]" />1,27,407 Nodes</span>
                  <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-[#4db8ff]" />4,01,090 Relationships</span>
                </div>
              </div>
            </div>
            <nav className="flex items-center gap-1 rounded-full border border-[#1f2a3b] bg-[#0f1b2d] p-1 text-sm font-medium">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 transition-colors text-xs ${isActive
                      ? 'bg-[#1a2940] text-[#eaf2ff] shadow-[inset_0_0_0_1px_rgba(77,184,255,0.2)]'
                      : 'text-[#91a5c2] hover:bg-[#142238] hover:text-[#f1f6ff]'
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
