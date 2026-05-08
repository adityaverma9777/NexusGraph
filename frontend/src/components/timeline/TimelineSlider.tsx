import { useTimeline } from '../../hooks/useTimeline'

export default function TimelineSlider() {
  const { currentDate, setCurrentDate } = useTimeline()

  return (
    <div className="space-y-2">
      <input
        type="month"
        value={currentDate}
        onChange={(event) => setCurrentDate(event.target.value)}
        className="w-full rounded-lg border border-[#d6d0c7] px-3 py-2 text-sm"
      />
      <p className="text-xs text-[#6a6374]">Snapshot: {currentDate}</p>
    </div>
  )
}
