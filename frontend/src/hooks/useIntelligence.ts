import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/api'
import { useGraphStore } from '../store/graphStore'

type BriefingRequest = {
  entityId: string
  contextNodes?: string[]
}

export function useIntelligence(request?: BriefingRequest) {
  const currentDate = useGraphStore((s) => s.currentDate)

  const query = useQuery({
    queryKey: ['briefing', request?.entityId, currentDate],
    queryFn: async () => {
      if (!request) {
        return null
      }
      const body = { ...request, date: currentDate }
      return apiClient('/api/intelligence/briefing', {
        method: 'POST',
        body: JSON.stringify(body),
      })
    },
    enabled: Boolean(request?.entityId),
  })

  return query
}
