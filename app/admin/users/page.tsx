"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { User, Role } from "@prisma/client";
import { DataTable } from "@/components/DataTable";
import { FilterBar } from "@/components/ui/filter-bar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { usePagination, FilterConfig } from "@/hooks/usePagination";
import { DateRange } from "react-day-picker";
import type { Route } from "next";

const columns = [
  {
    key: "name",
    label: "Name",
    filterType: "text" as const,
  },
  {
    key: "email",
    label: "Email",
    filterType: "text" as const,
  },
  {
    key: "role",
    label: "Role",
    filterType: "select" as const,
    filterOptions: [
      { value: "ADMIN", label: "Admin" },
      { value: "USER", label: "User" },
    ],
  },
  {
    key: "createdAt",
    label: "Created At",
    filterType: "date" as const,
  },
];

export default function UsersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | "all">("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchUsers = async (page: number, pageSize: number, search: string, filters: FilterConfig[]) => {
    const response = await fetch(`/api/users?page=${page}&pageSize=${pageSize}&search=${search}&role=${selectedRole}&sortField=${sortField}&sortOrder=${sortOrder}${dateRange ? `&from=${dateRange.from?.toISOString()}&to=${dateRange.to?.toISOString()}` : ''}`);
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    const data = await response.json();
    return {
      items: data.users,
      total: data.total,
      hasMore: data.hasMore,
    };
  };

  const {
    items: users,
    isLoading: loading,
    error,
    currentPage: page,
    totalPages,
    totalItems,
    pageSize,
    handlePageChange: setPage,
    handlePageSizeChange: setPageSize,
    retry: refresh,
    handleSearchChange,
    handleFilterChange,
  } = usePagination<User>({
    initialPageSize: 10,
    fetchData: fetchUsers,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [status, session, router]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    handleSearchChange(query);
  };

  const handleRoleChange = (role: string) => {
    setSelectedRole(role as Role | "all");
    handleFilterChange([{ key: 'role', value: role, operator: 'equals', type: 'select' }]);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range) {
      handleFilterChange([{ key: 'dateRange', value: { min: range.from?.getTime() || 0, max: range.to?.getTime() || 0 }, operator: 'between', type: 'range' }]);
    } else {
      handleFilterChange([]);
    }
  };

  const handleSortChange = (sort: { field: string; order: "asc" | "desc" }) => {
    setSortField(sort.field);
    setSortOrder(sort.order);
    handleFilterChange([{ key: 'sort', value: sort.field, operator: 'equals', type: 'text' }]);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedRole("all");
    setDateRange(undefined);
    setSortField("createdAt");
    setSortOrder("desc");
    handleSearchChange("");
    handleFilterChange([]);
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button onClick={() => router.push("/admin/users/invite" as Route)}>
          <Plus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>

      <FilterBar
        onSearch={handleSearch}
        onRoleChange={handleRoleChange}
        onDateRangeChange={handleDateRangeChange}
        onSortChange={handleSortChange}
        onClear={handleClearFilters}
      />

      <DataTable
        endpoint="/api/users"
        columns={columns}
      />
    </div>
  );
} 