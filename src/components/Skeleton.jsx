import { cn } from "@/lib/cn";

export function Skeleton({ width, height, rounded = "md", className }) {
  return (
    <div
      className={cn("bg-gradient-to-r from-cream-200 via-cream-100 to-cream-200 bg-[length:200%_100%] animate-shimmer", `rounded-${rounded}`, className)}
      style={{ width, height }}
    />
  );
}

export function PlantCardSkeleton() {
  return (
    <div className="p-4 rounded-lg bg-cream-50/50 flex items-center gap-3">
      <Skeleton width={40} height={40} rounded="full" />
      <div className="flex-1 space-y-2">
        <Skeleton width="60%" height={15} />
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
      <PlantCardSkeleton />
    </div>
  );
}
