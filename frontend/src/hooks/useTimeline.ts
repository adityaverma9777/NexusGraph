import { useGraphStore } from '../store/graphStore'

export function useTimeline() {
  const currentDate = useGraphStore((state) => state.currentDate)
  const setCurrentDate = useGraphStore((state) => state.setCurrentDate)

  return { currentDate, setCurrentDate }
}
