export default function RiskGauge() {
  const riskLevel = 7.2
  const riskColor = riskLevel > 7 ? '#ef233c' : riskLevel > 5 ? '#f4a261' : '#52b788'

  return (
    <div className="rounded-xl border border-[#1f2a3b] bg-[#0d1828] p-6 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-[#8ea3c1]">System Risk Level</p>
      <svg className="mx-auto h-32 w-32" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#27364d" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={riskColor}
          strokeWidth="8"
          strokeDasharray={`${(riskLevel / 10) * 282.6} 282.6`}
          strokeLinecap="round"
        />
        <text x="50" y="60" textAnchor="middle" fontSize="32" fontWeight="bold" fill={riskColor}>
          {riskLevel.toFixed(1)}
        </text>
      </svg>
      <p className="mt-3 text-sm font-semibold text-[#dce8f9]">
        {riskLevel > 7 ? 'High' : riskLevel > 5 ? 'Medium' : 'Low'} Risk
      </p>
    </div>
  )
}
