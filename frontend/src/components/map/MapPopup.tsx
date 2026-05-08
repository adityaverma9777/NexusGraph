type MapPopupProps = {
  title: string
  summary?: string
}

export default function MapPopup({ title, summary }: MapPopupProps) {
  return (
    <div className="rounded-xl border border-[#2b3a52] bg-[#101b2c] p-3 text-xs text-[#c6d7ec]">
      <p className="font-semibold text-[#e6edf7]">{title}</p>
      <p className="mt-1">{summary ?? 'Regional signal summary available via backend overlays.'}</p>
    </div>
  )
}
