import { datasetRegistry } from '../lib/mockData'

export default function DataRegistry() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[#6a6374]">Dataset Registry</p>
        <h2 className="text-2xl font-semibold">All ingested sources ({datasetRegistry.length})</h2>
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
            {datasetRegistry.map((dataset) => (
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
