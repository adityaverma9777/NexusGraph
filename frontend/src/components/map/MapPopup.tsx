import { domainColors } from '../../lib/mockData'
import type { Domain } from '../../lib/mockData'

type MapPopupProps = {
  title: string
  summary?: string
  domain?: string
  entityType?: string
  severity?: number
}

export default function MapPopup({ title, summary, domain, entityType, severity }: MapPopupProps) {
  const color = domain ? domainColors[domain as Domain] : '#4db8ff'
  const severityLabel =
    severity !== undefined
      ? severity > 7
        ? 'High'
        : severity > 5
          ? 'Medium'
          : 'Low'
      : null
  const severityColor = severity !== undefined ? (severity > 7 ? '#ef233c' : severity > 5 ? '#f4a261' : '#52b788') : null

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 180, background: '#0d1828', border: '1px solid #2a3b53', borderRadius: 10, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        {domain && (
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
        )}
        <span style={{ fontWeight: 700, fontSize: 13, color: '#eaf2ff', lineHeight: 1.3 }}>{title}</span>
      </div>
      {entityType && (
        <p style={{ fontSize: 11, color: color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          {entityType}
        </p>
      )}
      {severity !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: '#7090b0' }}>Severity</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: severityColor ?? '#eaf2ff' }}>
            {severity.toFixed(1)} — {severityLabel}
          </span>
        </div>
      )}
      <p style={{ fontSize: 11, color: '#8aa0bf', marginTop: 4 }}>
        {summary ?? 'Click node in graph explorer to expand relationships.'}
      </p>
    </div>
  )
}
