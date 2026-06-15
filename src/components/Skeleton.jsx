import { cn } from "@/lib/cn";

export function Skeleton({ width, height, rounded = "md", className }) {
  return (
    <div
      className={cn("animate-pulse bg-cream-200", `rounded-${rounded}`, className)}
      style={{ width, height }}
    />
  );
}

export function PlantCardSkeleton() {
  return (
    <div className="p-4 rounded-lg bg-cream-50/50 flex items-center gap-3">
      <Skeleton width={48} height={48} rounded="full" />
      <div className="flex-1 space-y-2">
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={12} />
      </div>
      <Skeleton width={56} height={56} rounded="full" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-3">
      <PlantCardSkeleton />
      <PlantCardSkeleton />
      <PlantCardSkeleton />
    </div>
  );
}
