import { NavLink, Route, Routes } from 'react-router-dom'
import Briefing from './pages/Briefing'
import DataRegistry from './pages/DataRegistry'
import Home from './pages/Home'
import MapView from './pages/MapView'
import Timeline from './pages/Timeline'

const navItems = [
  { label: 'Graph', to: '/' },
  { label: 'Map', to: '/map' },
  { label: 'Timeline', to: '/timeline' },
  { label: 'Briefing', to: '/briefing' },
  { label: 'Datasets', to: '/datasets' },
]

function App() {
  return (
    <div className="min-h-screen bg-[#f6f4ef] text-[#141218]">
      <header className="border-b border-[#dedad3] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#5b5561]">
              NexusGraph
            </p>
            <h1 className="text-2xl font-semibold">Relationship Intelligence Engine</h1>
          </div>
          <nav className="flex items-center gap-5 text-sm font-medium">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `transition-colors ${
                    isActive ? 'text-[#141218]' : 'text-[#6a6374] hover:text-[#1d1a20]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
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
