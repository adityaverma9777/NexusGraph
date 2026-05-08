import { useGraphStore } from '../../store/graphStore'

export default function ConceptSearch() {
  const searchTerm = useGraphStore((state) => state.searchTerm)
  const setSearchTerm = useGraphStore((state) => state.setSearchTerm)

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#e0dcd4] bg-[#fbfaf8] px-4 py-3">
      <input
        className="flex-1 bg-transparent text-sm text-[#3c3741] placeholder:text-[#8a8392] focus:outline-none"
        placeholder="Search a concept: rainfall, dengue, food price..."
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
      />
      <button
        type="button"
        className="rounded-full bg-[#141218] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
      >
        Explore
      </button>
    </div>
  )
}
