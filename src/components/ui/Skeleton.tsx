interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-[40px] ${className}`}
    />
  );
}

export function KPIPanelSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[0, 1, 2].map(i => (
        <Skeleton key={i} className="h-36" />
      ))}
      <Skeleton className="md:col-span-3 h-52" />
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-[40px] border border-slate-100 dark:border-slate-700 p-8 space-y-5">
      <Skeleton className="h-6 w-48 rounded-2xl" />
      {[0, 1, 2, 3, 4].map(i => (
        <Skeleton key={i} className="h-12 rounded-2xl" />
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return <Skeleton className="h-64 w-full" />;
}
