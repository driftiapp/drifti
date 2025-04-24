import { Suspense } from "react";
import { UserDetails } from "@/components/dashboard/user-details";
import { MetricCardSkeleton } from "@/components/ui/metric-card-skeleton";

export default function UserPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Details</h1>
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
        <UserDetails userId={params.id} />
      </Suspense>
    </div>
  );
} 