import { DataTable } from "@/components/DataTable";
import { DateRange } from "react-day-picker";
import { useQuery } from "@tanstack/react-query";
import { getUsers } from "@/lib/api";
import { columns } from "@/components/dashboard/users-columns";

interface UsersTableProps {
  dateRange?: DateRange;
}

export function UsersTable({ dateRange }: UsersTableProps) {
  const { data: users, isLoading } = useQuery({
    queryKey: ["users", dateRange],
    queryFn: () => getUsers(dateRange),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <DataTable
      data={users || []}
      columns={columns}
      dateRange={dateRange}
    />
  );
} 