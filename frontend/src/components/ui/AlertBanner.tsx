type AlertBannerProps = {
  title: string
  detail: string
}

export default function AlertBanner({ title, detail }: AlertBannerProps) {
  return (
    <div className="rounded-2xl border border-[#5f4c30] bg-[#201812] p-4 text-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-[#dca56d]">Alert</p>
      <p className="mt-1 font-semibold text-[#fde7cf]">{title}</p>
      <p className="mt-1 text-[#e9c8a4]">{detail}</p>
    </div>
  )
}
