type ConfidenceBadgeProps = {
  value: number
}

export default function ConfidenceBadge({ value }: ConfidenceBadgeProps) {
  const percent = Math.round(value * 100)

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#2d3d54] bg-[#101b2c] px-3 py-1 text-xs">
      <span className="text-[#8ea3c1]">Confidence</span>
      <span className="font-semibold text-[#eaf2ff]">{percent}%</span>
    </div>
  )
}
