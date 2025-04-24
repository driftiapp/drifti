import { Metadata } from "next";
import { UsersTable } from "@/components/dashboard/users-table";
import { DateRangeSelector } from "@/components/ui/date-range-selector";
import { DateRange } from "react-day-picker";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Users | Dashboard",
  description: "View and manage users in your organization",
};

export default function UsersPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const dateRange: DateRange | undefined = searchParams.from && searchParams.to
    ? {
        from: new Date(searchParams.from),
        to: new Date(searchParams.to),
      }
    : undefined;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <DateRangeSelector value={dateRange} />
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <UsersTable dateRange={dateRange} />
      </Suspense>
    </div>
  );
} 