type SkeletonProps = {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded bg-[#1a2a3d] ${className}`}
      aria-hidden="true"
    />
  )
}

export function GraphSkeleton() {
  return (
    <div className="h-[420px] overflow-hidden rounded-2xl border border-[#1f2a3b] bg-[#0a1220] p-6">
      <div className="flex h-full flex-col items-center justify-center gap-6">
        <div className="relative flex items-center justify-center">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="absolute left-20 top-0">
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
          <div className="absolute right-20 top-4">
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <div className="absolute bottom-[-20px] left-8">
            <Skeleton className="h-14 w-14 rounded-full" />
          </div>
          <div className="absolute bottom-[-16px] right-8">
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
        <p className="mt-8 text-xs uppercase tracking-[0.2em] text-[#3a5070]">Loading graph...</p>
      </div>
    </div>
  )
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3 rounded-2xl border border-[#1f2a3b] bg-[#0f1724]/95 p-6">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-5 w-48" />
      <div className="space-y-2 pt-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={`h-3 ${i === lines - 1 ? 'w-3/5' : 'w-full'}`} />
        ))}
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#1f2a3b] bg-[#0f1724]/95">
      <div className="bg-[#122136] px-5 py-3">
        <Skeleton className="h-3 w-64" />
      </div>
      <div className="divide-y divide-[#1a2638]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-8 px-5 py-4">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
