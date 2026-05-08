type MapPopupProps = {
  title: string
  summary?: string
}

export default function MapPopup({ title, summary }: MapPopupProps) {
  return (
    <div className="rounded-xl border border-[#e0dcd4] bg-white p-3 text-xs text-[#4d4852]">
      <p className="font-semibold text-[#3c3741]">{title}</p>
      <p className="mt-1">{summary ?? 'Regional signal summary available via backend overlays.'}</p>
    </div>
  )
}
