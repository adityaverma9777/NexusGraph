import { useState, useEffect } from 'react'
import { cascadeSteps } from '../../lib/mockData'

export default function CascadeAnimation() {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % cascadeSteps.length)
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="rounded-2xl border border-[#e0dcd4] bg-white p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-[#6a6374]">Cascade</p>
      <h3 className="mt-1 text-lg font-semibold">Systemic ripple playback</h3>
      <div className="mt-6 space-y-3">
        {cascadeSteps.map((step, idx) => (
          <div
            key={idx}
            className={`rounded-lg px-4 py-3 text-sm transition-all ${
              idx <= activeStep
                ? 'bg-[#ef233c] text-white'
                : idx === activeStep + 1
                  ? 'bg-[#f4a261] text-white'
                  : 'bg-[#f3f0ea] text-[#6a6374]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/30 text-xs">
                {idx + 1}
              </span>
              {step}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
