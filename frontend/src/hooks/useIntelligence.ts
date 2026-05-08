import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/api'

type BriefingRequest = {
  entityId: string
  contextNodes?: string[]
}

export function useIntelligence(request?: BriefingRequest) {
  const query = useQuery({
    queryKey: ['briefing', request?.entityId],
    queryFn: async () => {
      if (!request) {
        return null
      }
      return apiClient('/api/intelligence/briefing', {
        method: 'POST',
        body: JSON.stringify(request),
      })
    },
    enabled: Boolean(request?.entityId),
  })

  return query
}
