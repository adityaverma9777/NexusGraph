import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/api'
import { useGraphStore } from '../store/graphStore'

type BriefingRequest = {
  entityId: string
  contextNodes?: string[]
}

export function useIntelligence(request?: BriefingRequest) {
  const currentDate = useGraphStore((s) => s.currentDate)
  const contextKey = request?.contextNodes?.join('|') ?? ''

  const query = useQuery({
    queryKey: ['briefing', request?.entityId, contextKey, currentDate],
    queryFn: async () => {
      if (!request) {
        return null
      }
      const body = {
        entity_id: request.entityId,
        context_node_ids: request.contextNodes ?? [],
        as_of: currentDate,
      }
      return apiClient('/api/intelligence/briefing', {
        method: 'POST',
        body: JSON.stringify(body),
      })
    },
    enabled: Boolean(request?.entityId),
  })

  return query
}
