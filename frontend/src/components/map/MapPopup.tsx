import { domainColors } from '../../lib/mockData'
import type { Domain } from '../../lib/mockData'

type MapPopupProps = {
  title: string
  summary?: string
  domain?: string
  entityType?: string
  severity?: number
  relationshipCount?: number
  relationships?: Array<{ relationship?: string; peer_label?: string; peer_id?: string; confidence?: number }>
  isGraphNode?: boolean
  onOpenInGraph?: () => void
}

export default function MapPopup({
  title,
  summary,
  domain,
  entityType,
  severity,
  relationshipCount,
  relationships,
  isGraphNode,
  onOpenInGraph,
}: MapPopupProps) {
  const color = domain ? domainColors[domain as Domain] : '#4db8ff'
  const severityLabel =
    severity !== undefined
      ? severity > 7
        ? 'High'
        : severity > 5
          ? 'Medium'
          : 'Low'
      : null
  const severityColor =
    severity !== undefined
      ? severity > 7
        ? '#ef233c'
        : severity > 5
          ? '#f4a261'
          : '#52b788'
      : null

  return (
    <div
      style={{
        fontFamily: 'Inter, sans-serif',
        minWidth: 190,
        background: '#0d1828',
        border: '1px solid #2a3b53',
        borderRadius: 10,
        padding: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        {domain && (
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
        )}
        <span style={{ fontWeight: 700, fontSize: 13, color: '#eaf2ff', lineHeight: 1.3 }}>{title}</span>
      </div>
      {entityType && (
        <p style={{ fontSize: 11, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          {entityType}
        </p>
      )}
      {severity !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: '#7090b0' }}>Severity</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: severityColor ?? '#eaf2ff' }}>
            {severity.toFixed(1)} - {severityLabel}
          </span>
        </div>
      )}
      {relationshipCount !== undefined && (
        <div style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: '#7090b0' }}>Relationships</span>
          <div style={{ marginTop: 2, fontSize: 12, fontWeight: 700, color: '#eaf2ff' }}>
            {relationshipCount} connected edge{relationshipCount === 1 ? '' : 's'}
          </div>
          {relationships && relationships.length > 0 && (
            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {relationships.slice(0, 3).map((item, index) => (
                <span
                  key={`${item.relationship ?? 'rel'}-${index}`}
                  style={{
                    border: '1px solid #2a3b53',
                    borderRadius: 999,
                    color: '#c6d7ec',
                    fontSize: 10,
                    padding: '2px 8px',
                    background: '#0a1220',
                  }}
                >
                  {item.relationship ?? 'RELATES_TO'} · {item.peer_label ?? item.peer_id ?? 'peer'}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      <p style={{ fontSize: 11, color: '#8aa0bf', marginBottom: isGraphNode ? 10 : 0 }}>
        {summary ?? 'Regional intelligence node - click below to explore in the graph.'}
      </p>
      {isGraphNode && onOpenInGraph && (
        <button
          onClick={onOpenInGraph}
          style={{
            display: 'block',
            width: '100%',
            marginTop: 4,
            padding: '6px 12px',
            background: '#193254',
            border: '1px solid #2f4564',
            borderRadius: 6,
            color: '#eaf2ff',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          {'Open in Graph Explorer ->'}
        </button>
      )}
    </div>
  )
}
