import { useState, useEffect } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { useDebounce } from "@/hooks/use-debounce";

interface FilterBarProps {
  onSearch: (query: string) => void;
  onRoleChange: (role: string) => void;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onSortChange: (sort: { field: string; order: "asc" | "desc" }) => void;
  onClear: () => void;
  className?: string;
}

export function FilterBar({
  onSearch,
  onRoleChange,
  onDateRangeChange,
  onSortChange,
  onClear,
  className,
}: FilterBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    onSearch(debouncedSearch);
  }, [debouncedSearch, onSearch]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleRoleChange = (value: string) => {
    setSelectedRole(value);
    onRoleChange(value);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    onDateRangeChange(range);
  };

  const handleSortChange = (field: string) => {
    const newOrder = field === sortField && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(newOrder);
    onSortChange({ field, order: newOrder });
  };

  const handleClear = () => {
    setSearchQuery("");
    setSelectedRole("");
    setDateRange(undefined);
    setSortField("createdAt");
    setSortOrder("desc");
    onClear();
  };

  const hasFilters = searchQuery || selectedRole || dateRange;

  return (
    <div className={className}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={selectedRole} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Roles</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="USER">User</SelectItem>
          </SelectContent>
        </Select>

        <DateRangePicker
          value={dateRange}
          onChange={handleDateRangeChange}
          className="w-[300px]"
        />

        <Select
          value={`${sortField}-${sortOrder}`}
          onValueChange={(value) => {
            const [field, order] = value.split("-") as [string, "asc" | "desc"];
            handleSortChange(field);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="createdAt-desc">Newest First</SelectItem>
            <SelectItem value="createdAt-asc">Oldest First</SelectItem>
            <SelectItem value="lastLoginAt-desc">Recently Active</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-10"
          >
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
} 