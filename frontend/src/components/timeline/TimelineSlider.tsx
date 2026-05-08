import { useTimeline } from '../../hooks/useTimeline'
import { useState, useEffect, useRef } from 'react'

function addMonths(ym: string, delta = 1) {
  // ym format: YYYY-MM
  const [y, m] = ym.split('-').map(Number)
  const date = new Date(y, m - 1 + delta, 1)
  const nextY = date.getFullYear()
  const nextM = String(date.getMonth() + 1).padStart(2, '0')
  return `${nextY}-${nextM}`
}

export default function TimelineSlider() {
  const { currentDate, setCurrentDate } = useTimeline()
  const [isPlaying, setIsPlaying] = useState(false)
  const intervalRef = useRef<number | null>(null)
  const currentRef = useRef(currentDate)

  useEffect(() => {
    currentRef.current = currentDate
  }, [currentDate])

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setCurrentDate(addMonths(currentRef.current, 1))
      }, 1500)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, setCurrentDate])

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <button
          className="rounded border border-[#2b3a52] bg-[#0f1b2d] px-3 py-2 text-sm text-[#dce8f9] hover:bg-[#16253a]"
          onClick={() => setCurrentDate(addMonths(currentDate, -1))}
        >
          Prev
        </button>
        <input
          type="month"
          value={currentDate}
          onChange={(event) => setCurrentDate(event.target.value)}
          className="flex-1 rounded-lg border border-[#2b3a52] bg-[#0f1b2d] px-3 py-2 text-sm text-[#e6edf7]"
        />
        <button
          className="rounded border border-[#2b3a52] bg-[#0f1b2d] px-3 py-2 text-sm text-[#dce8f9] hover:bg-[#16253a]"
          onClick={() => setCurrentDate(addMonths(currentDate, 1))}
        >
          Next
        </button>
        <button
          className="rounded bg-[#244a74] px-3 py-2 text-sm text-[#eaf3ff] hover:bg-[#2d5d92]"
          onClick={() => setIsPlaying((p) => !p)}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>
      <p className="text-xs text-[#91a5c2]">Snapshot: {currentDate}</p>
    </div>
  )
}
