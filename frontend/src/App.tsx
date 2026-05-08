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
    <div className="min-h-screen bg-transparent text-[#e6edf7]">
      <header className="border-b border-[#1f2a3b] bg-[#0c1422]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-8 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-[#7f93b1]">
              NexusGraph
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-[#f3f7ff]">Relationship Intelligence Engine</h1>
          </div>
          <nav className="flex items-center gap-2 rounded-full border border-[#1f2a3b] bg-[#0f1b2d] p-1.5 text-sm font-medium">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 transition-colors ${
                    isActive
                      ? 'bg-[#1a2940] text-[#eaf2ff] shadow-[inset_0_0_0_1px_rgba(123,166,255,0.24)]'
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
