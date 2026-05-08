type ConfidenceBadgeProps = {
  value: number
}

export default function ConfidenceBadge({ value }: ConfidenceBadgeProps) {
  const percent = Math.round(value * 100)

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#d6d0c7] px-3 py-1 text-xs">
      <span className="text-[#6a6374]">Confidence</span>
      <span className="font-semibold text-[#141218]">{percent}%</span>
    </div>
  )
}
