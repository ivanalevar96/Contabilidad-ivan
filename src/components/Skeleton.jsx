export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-800/60 rounded ${className}`} />;
}

export function SkeletonCard({ className = '', children }) {
  return (
    <div className={`card p-4 ${className}`}>
      {children}
    </div>
  );
}

export function MesSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonCard className="p-5">
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="grid sm:grid-cols-3 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </SkeletonCard>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <SkeletonCard>
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-3 w-full" />
      </SkeletonCard>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
