import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/api'
import { datasetRegistry } from '../lib/mockData'

type DatasetRow = {
  name: string
  domain: string
  source: string
  update: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function toDatasetRow(input: unknown): DatasetRow | null {
  const record = asRecord(input)
  if (!record) {
    return null
  }

  const name =
    typeof record.name === 'string'
      ? record.name
      : typeof record.dataset_name === 'string'
        ? record.dataset_name
        : undefined
  if (!name) {
    return null
  }

  return {
    name,
    domain: typeof record.domain === 'string' ? record.domain : 'Unknown',
    source: typeof record.source === 'string' ? record.source : 'Unknown',
    update:
      typeof record.update === 'string'
        ? record.update
        : typeof record.update_frequency === 'string'
          ? record.update_frequency
          : 'Unknown',
  }
}

function normalizeDatasets(payload: unknown): DatasetRow[] | null {
  const top = asRecord(payload)
  if (!top) {
    return null
  }

  const nested = asRecord(top.data)
  const source =
    (Array.isArray(top.datasets) ? top.datasets : undefined) ??
    (Array.isArray(top.items) ? top.items : undefined) ??
    (Array.isArray(nested?.datasets) ? nested.datasets : undefined)

  if (!source) {
    return null
  }

  const rows = source.map((item) => toDatasetRow(item)).filter((item): item is DatasetRow => Boolean(item))
  return rows.length ? rows : null
}

export default function DataRegistry() {
  const query = useQuery({
    queryKey: ['datasets-registry'],
    queryFn: async () => {
      const payload = await apiClient('/api/datasets/registry')
      return normalizeDatasets(payload)
    },
    retry: 1,
    staleTime: 5 * 60_000,
  })

  const datasets = query.data?.length ? query.data : datasetRegistry

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[#6a6374]">Dataset Registry</p>
        <h2 className="text-2xl font-semibold">All ingested sources ({datasets.length})</h2>
        {query.isFetching && <p className="mt-1 text-xs text-[#6a6374]">Refreshing from backend...</p>}
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#e0dcd4] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#f3f0ea] text-xs uppercase tracking-[0.2em] text-[#6a6374]">
            <tr>
              <th className="px-5 py-3">Dataset</th>
              <th className="px-5 py-3">Domain</th>
              <th className="px-5 py-3">Source</th>
              <th className="px-5 py-3">Update</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e0dcd4]">
            {datasets.map((dataset) => (
              <tr key={dataset.name} className="hover:bg-[#fbfaf8]">
                <td className="px-5 py-4 font-medium text-[#3c3741]">{dataset.name}</td>
                <td className="px-5 py-4 text-[#6a6374]">{dataset.domain}</td>
                <td className="px-5 py-4 text-[#6a6374]">{dataset.source}</td>
                <td className="px-5 py-4 text-[#6a6374]">{dataset.update}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
