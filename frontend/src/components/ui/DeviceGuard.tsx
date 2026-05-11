import { useState, useEffect } from 'react'

export default function DeviceGuard({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (isMobile) {
    return (
      <div className="flex h-[100svh] w-full flex-col items-center justify-center bg-[#070b12] p-8 text-center text-[#e6edf7]">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#1f2a3b] bg-[#0c1422]">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4db8ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        </div>
        <h1 className="mb-3 text-2xl font-semibold tracking-tight text-[#f3f7ff]">Desktop Required</h1>
        <p className="max-w-md text-sm leading-relaxed text-[#91a5c2]">
          NexusGraph is an intelligence platform optimized exclusively for PC and Laptop displays. 
          Please access this site from a larger screen to explore the multi-domain knowledge graph.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
