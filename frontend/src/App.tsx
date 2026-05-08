import { NavLink, Route, Routes } from 'react-router-dom'
import Briefing from './pages/Briefing'
import DataRegistry from './pages/DataRegistry'
import Home from './pages/Home'
import MapView from './pages/MapView'
import Timeline from './pages/Timeline'
import { useGraphStore } from './store/graphStore'

const navItems = [
  { label: 'Graph', to: '/' },
  { label: 'Map', to: '/map' },
  { label: 'Timeline', to: '/timeline' },
  { label: 'Briefing', to: '/briefing' },
  { label: 'Datasets', to: '/datasets' },
]

function App() {
  const currentDate = useGraphStore((state) => state.currentDate)

  return (
    <div className="min-h-screen bg-transparent text-[#e6edf7]">
      <header className="sticky top-0 z-50 border-b border-[#1f2a3b] bg-[#0c1422]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-8 py-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-[#4db8ff]">NexusGraph</p>
              <h1 className="text-xl font-semibold tracking-tight text-[#f3f7ff]">Relationship Intelligence Engine</h1>
            </div>
            <div className="hidden items-center gap-3 pl-4 border-l border-[#1f2a3b] sm:flex">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#52b788] animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#52b788]">Live</span>
              </div>
              <span className="text-[10px] text-[#4a6a8a]">|</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#6a8aaa]">
                Snapshot: {currentDate}
              </span>
              <span className="text-[10px] text-[#4a6a8a]">|</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#6a8aaa]">39 datasets</span>
            </div>
          </div>
          <nav className="flex items-center gap-1 rounded-full border border-[#1f2a3b] bg-[#0f1b2d] p-1 text-sm font-medium">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 transition-colors text-xs ${
                    isActive
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
      <main className="mx-auto max-w-[1440px] px-8 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/briefing" element={<Briefing />} />
          <Route path="/datasets" element={<DataRegistry />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
