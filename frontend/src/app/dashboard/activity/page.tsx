import { Suspense } from "react";
import { ActivityView } from "@/components/dashboard/activity-view";
import { MetricCardSkeleton } from "@/components/ui/metric-card-skeleton";

export default function ActivityPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Activity</h1>
      </div>
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <MetricCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <ActivityView />
      </Suspense>
    </div>
  );
} 