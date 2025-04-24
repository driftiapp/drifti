import { DateRange } from "@/components/ui/date-range-selector";

export async function getUsers(dateRange?: DateRange) {
  const params = new URLSearchParams();
  if (dateRange?.from) {
    params.append("from", dateRange.from.toISOString());
  }
  if (dateRange?.to) {
    params.append("to", dateRange.to.toISOString());
  }

  const response = await fetch(`/api/users?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  return response.json();
} 