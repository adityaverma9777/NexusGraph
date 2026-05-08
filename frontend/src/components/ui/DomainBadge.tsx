type DomainBadgeProps = {
  label: string
}

export default function DomainBadge({ label }: DomainBadgeProps) {
  return (
    <span className="rounded-full border border-[#355476] bg-[#17314f] px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#eaf3ff]">
      {label}
    </span>
  )
}
