type AlertBannerProps = {
  title: string
  detail: string
}

export default function AlertBanner({ title, detail }: AlertBannerProps) {
  return (
    <div className="rounded-2xl border border-[#e2c6a6] bg-[#fdf4ea] p-4 text-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-[#8a5a25]">Alert</p>
      <p className="mt-1 font-semibold text-[#3f2b1c]">{title}</p>
      <p className="mt-1 text-[#6a4b2d]">{detail}</p>
    </div>
  )
}
