type AlertBannerProps = {
  title: string
  detail: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

const SEVERITY_STYLES = {
  low: {
    border: 'border-[#2a3d2a]',
    bg: 'bg-[#0f1f0f]',
    label: 'text-[#6dbf6d]',
    text: 'text-[#c5e8c5]',
    sub: 'text-[#a0c8a0]',
  },
  medium: {
    border: 'border-[#5f4c30]',
    bg: 'bg-[#201812]',
    label: 'text-[#dca56d]',
    text: 'text-[#fde7cf]',
    sub: 'text-[#e9c8a4]',
  },
  high: {
    border: 'border-[#6b2020]',
    bg: 'bg-[#1e0d0d]',
    label: 'text-[#f07070]',
    text: 'text-[#ffd6d6]',
    sub: 'text-[#e8b0b0]',
  },
  critical: {
    border: 'border-[#8b1a1a]',
    bg: 'bg-[#200808]',
    label: 'text-[#ff4444]',
    text: 'text-[#ffe0e0]',
    sub: 'text-[#ff9999]',
  },
}

export default function AlertBanner({ title, detail, severity = 'medium' }: AlertBannerProps) {
  const s = SEVERITY_STYLES[severity]
  return (
    <div className={`rounded-2xl border ${s.border} ${s.bg} p-4 text-sm`}>
      <p className={`text-xs uppercase tracking-[0.3em] ${s.label}`}>{severity} alert</p>
      <p className={`mt-1 font-semibold ${s.text}`}>{title}</p>
      <p className={`mt-1 ${s.sub}`}>{detail}</p>
    </div>
  )
}
