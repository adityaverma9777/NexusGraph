import { useMemo, useState } from 'react'
import datasetData from './datasets.json'

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
    source:
      typeof record.source === 'string'
        ? record.source
        : typeof record.source_url === 'string'
          ? record.source_url
          : 'Unknown',
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

const UPDATE_COLORS: Record<string, string> = {
  Realtime: '#52b788',
  Daily: '#ffffff',
  Weekly: '#a8dadc',
  Monthly: '#f4a261',
  Annual: '#c77dff',
  Biannual: '#f4a261',
  Decadal: '#ef233c',
  Variable: '#bbbbbb',
  '16-day': '#a8dadc',
}

export default function DataRegistry() {
  const [search, setSearch] = useState('')
  const [domainFilter, setDomainFilter] = useState('All')

  const allDatasets = useMemo(() => normalizeDatasets(datasetData) ?? [], [])
  const domains = useMemo(
    () => ['All', ...Array.from(new Set(allDatasets.map((d) => d.domain))).sort()],
    [allDatasets],
  )
  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return allDatasets.filter((d) => {
      const matchesDomain = domainFilter === 'All' || d.domain === domainFilter
      const matchesSearch = !term || d.name.toLowerCase().includes(term) || d.source.toLowerCase().includes(term)
      return matchesDomain && matchesSearch
    })
  }, [allDatasets, search, domainFilter])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[#aaaaaa]">Dataset Registry</p>
        <h2 className="text-2xl font-semibold text-[#ffffff]">All ingested sources ({allDatasets.length})</h2>
      </div>
      <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search datasets..."
              className="w-56 rounded-lg border border-[#222222] bg-[#0a0a0a] px-3 py-2 text-sm text-[#f0f0f0] placeholder:text-[#6f86a7] focus:outline-none focus:border-[#4e79ab]"
            />
            <div className="flex flex-wrap gap-2">
              {domains.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDomainFilter(d)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    domainFilter === d
                      ? 'bg-[#193254] text-[#ffffff] border border-[#4e79ab]'
                      : 'border border-[#1a1a1a] text-[#bbbbbb] hover:border-[#222222]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <span className="ml-auto text-xs text-[#aaaaaa]">{filtered.length} results</span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#1a1a1a] bg-[#0f1724]/95">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#122136] text-xs uppercase tracking-[0.2em] text-[#8aa0bf]">
                <tr>
                  <th className="px-5 py-3">Dataset</th>
                  <th className="px-5 py-3">Domain</th>
                  <th className="px-5 py-3">Source</th>
                  <th className="px-5 py-3">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2638]">
                {filtered.map((dataset) => (
                  <tr key={dataset.name} className="transition-colors hover:bg-[#0d1f33]">
                    <td className="px-5 py-3.5 font-medium text-[#dce8f9]">{dataset.name}</td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-full border border-[#1a1a1a] bg-[#000000] px-2.5 py-0.5 text-xs text-[#cccccc]">
                        {dataset.domain}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[#cccccc]">{dataset.source}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{
                          color: UPDATE_COLORS[dataset.update] ?? '#bbbbbb',
                          backgroundColor: (UPDATE_COLORS[dataset.update] ?? '#bbbbbb') + '1a',
                          border: `1px solid ${UPDATE_COLORS[dataset.update] ?? '#bbbbbb'}33`,
                        }}
                      >
                        {dataset.update}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-[#7090b0]">
                      No datasets match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
    </div>
  )
}
