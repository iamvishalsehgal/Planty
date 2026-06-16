import { cn } from "@/lib/cn";

export function Skeleton({ width, height, rounded = "md", className }) {
  return (
    <div
      className={cn(
        "bg-gradient-to-r from-cream-200 via-cream-100 to-cream-200 bg-[length:200%_100%] animate-shimmer",
        `rounded-${rounded}`,
        className
      )}
      style={{ width, height }}
    />
  );
}

export function PlantCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-cream-50/50 border border-cream-200/30 flex items-center gap-4">
      <Skeleton width={56} height={56} rounded="2xl" />
      <div className="flex-1 space-y-2.5">
        <Skeleton width="55%" height={16} rounded="md" />
        <Skeleton width="35%" height={12} rounded="sm" />
      </div>
      <Skeleton width={48} height={48} rounded="full" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-3.5">
      <PlantCardSkeleton />
      <PlantCardSkeleton />
      <PlantCardSkeleton />
      <PlantCardSkeleton />
    </div>
  );
}
