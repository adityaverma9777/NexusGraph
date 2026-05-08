type DomainBadgeProps = {
  label: string
}

export default function DomainBadge({ label }: DomainBadgeProps) {
  return (
    <span className="rounded-full bg-[#141218] px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white">
      {label}
    </span>
  )
}
