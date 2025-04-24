"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityAction, EntityType } from "@/lib/activity-logger";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download } from "lucide-react";
import { toast } from "sonner";
import { useInView } from "react-intersection-observer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { VariableSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { ActivityItem } from "./activity-item";
import { PaginationControls } from "./pagination-controls";
import { useEventSource } from "@/hooks/use-event-source";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Activity as ActivityType, groupActivitiesByTime } from "@/lib/activity-utils";
import { ActivityDetailModal } from "./activity-detail-modal";
import { AnimatePresence } from "framer-motion";

interface Activity extends ActivityType { }

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ActivitiesResponse {
  activities: Activity[];
  pagination: Pagination;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const STALE_TIME = 30 * 1000; // 30 seconds
const ITEM_HEIGHT = 120; // Approximate height of each activity item
const OVERSCAN_COUNT = 5; // Number of items to render outside the visible area
const MIN_ITEM_HEIGHT = 100; // Minimum height for any item
const MAX_ITEM_HEIGHT = 300; // Maximum height for any item
const ESTIMATED_ITEM_HEIGHT = 120; // Default estimated height

// Helper function to parse date range from URL
const parseDateRangeFromUrl = (params: URLSearchParams): DateRange | undefined => {
  const from = params.get("from");
  const to = params.get("to");
  if (!from) return undefined;
  return {
    from: new Date(from),
    to: to ? new Date(to) : undefined,
  };
};

// Helper function to update URL with current filters
const updateUrlWithFilters = (
  filter: EntityType | "ALL",
  searchQuery: string,
  dateRange: DateRange | undefined,
  page: number,
  limit: number
) => {
  const params = new URLSearchParams(window.location.search);
  params.set("type", filter);
  params.set("search", searchQuery);
  params.set("page", page.toString());
  params.set("limit", limit.toString());

  if (dateRange?.from) {
    params.set("from", dateRange.from.toISOString());
  } else {
    params.delete("from");
  }

  if (dateRange?.to) {
    params.set("to", dateRange.to.toISOString());
  } else {
    params.delete("to");
  }

  window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
};

export function ActivityFeed() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<EntityType | "ALL">("ALL");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const listRef = useRef<List>(null);
  const { ref: loadMoreRef, inView } = useInView();
  const queryClient = useQueryClient();

  // Initialize state from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type") as EntityType | "ALL";
    const search = params.get("search") || "";
    const pageParam = parseInt(params.get("page") || "1");
    const limitParam = parseInt(params.get("limit") || "10");
    const dateRange = parseDateRangeFromUrl(params);

    setSelectedType(type || "ALL");
    setSearchQuery(search);
    setPage(pageParam);
    setLimit(limitParam);
    setDateRange(dateRange);
  }, []);

  // Update URL when filters change
  useEffect(() => {
    updateUrlWithFilters(selectedType, searchQuery, dateRange, page, limit);
  }, [selectedType, searchQuery, dateRange, page, limit]);

  // Set up SSE connection for real-time updates
  const { data: streamData, error: streamError } = useEventSource(
    `/api/activities/stream?type=${selectedType}`,
    {
      enabled: true,
      onMessage: (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        if (data.type === "initial") {
          queryClient.setQueryData(
            ["activities", selectedType, searchQuery, dateRange, page, limit],
            (old: any) => ({
              activities: data.activities,
              pagination: old?.pagination || {
                total: data.activities.length,
                page: 1,
                limit,
                totalPages: Math.ceil(data.activities.length / limit),
              },
            })
          );
        } else if (data.type === "update") {
          queryClient.setQueryData(
            ["activities", selectedType, searchQuery, dateRange, page, limit],
            (old: any) => {
              if (!old) return old;
              const activities = [data.activity, ...old.activities];
              return {
                activities,
                pagination: {
                  ...old.pagination,
                  total: old.pagination.total + 1,
                },
              };
            }
          );
        }
      },
    }
  );

  // Fetch activities
  const { data, isLoading, error } = useQuery<ActivitiesResponse>({
    queryKey: ["activities", selectedType, searchQuery, dateRange, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: selectedType,
        search: searchQuery,
        page: page.toString(),
        limit: limit.toString(),
      });

      if (dateRange?.from) {
        params.set("from", dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.set("to", dateRange.to.toISOString());
      }

      const response = await fetch(`/api/activities?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }
      return response.json();
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  // Handle infinite scroll
  useEffect(() => {
    if (inView && data?.pagination && data.pagination.page < data.pagination.totalPages) {
      setPage((prev) => prev + 1);
    }
  }, [inView, data?.pagination]);

  // Export activities
  const exportActivities = async () => {
    try {
      const params = new URLSearchParams({
        type: selectedType,
        search: searchQuery,
      });

      if (dateRange?.from) {
        params.set("from", dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.set("to", dateRange.to.toISOString());
      }

      const response = await fetch(`/api/activities/export?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to export activities");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `activities-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Failed to export activities");
    }
  };

  // Memoized grouped activities
  const groupedActivities = useMemo(() => {
    if (!data?.activities) return {};
    return groupActivitiesByTime(data.activities);
  }, [data?.activities]);

  // Memoized row renderer
  const rowRenderer = useMemo(
    () =>
      ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const groups = Object.entries(groupedActivities);
        let currentIndex = 0;
        let currentGroup: [string, Activity[]] | null = null;

        for (const group of groups) {
          if (currentIndex + group[1].length > index) {
            currentGroup = group;
            break;
          }
          currentIndex += group[1].length;
        }

        if (!currentGroup) return null;

        const [groupKey, activities] = currentGroup;
        const activity = activities[index - currentIndex];

        if (index === currentIndex) {
          return (
            <div className="w-full">
              <h3 className="text-lg font-semibold mb-2">{groupKey}</h3>
              <ActivityItem
                activity={activity}
                onClick={() => setSelectedActivity(activity)}
              />
            </div>
          );
        }

        return (
          <div className="w-full">
            <ActivityItem
              activity={activity}
              onClick={() => setSelectedActivity(activity)}
            />
          </div>
        );
      },
    [groupedActivities]
  );

  // Memoized item size getter
  const getItemSize = useMemo(
    () => (index: number) => {
      const groups = Object.entries(groupedActivities);
      let currentIndex = 0;
      let currentGroup: [string, Activity[]] | null = null;

      for (const group of groups) {
        if (currentIndex + group[1].length > index) {
          currentGroup = group;
          break;
        }
        currentIndex += group[1].length;
      }

      if (!currentGroup) return ESTIMATED_ITEM_HEIGHT;

      const [groupKey, activities] = currentGroup;
      const activity = activities[index - currentIndex];

      if (index === currentIndex) {
        return ESTIMATED_ITEM_HEIGHT + 40; // Extra height for group header
      }

      const detailsLength = activity.details
        ? JSON.stringify(activity.details).length
        : 0;
      const height = Math.max(
        MIN_ITEM_HEIGHT,
        Math.min(MAX_ITEM_HEIGHT, ITEM_HEIGHT + detailsLength / 10)
      );

      return height;
    },
    [groupedActivities]
  );

  // Show error state
  if (error || streamError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error?.message || streamError?.message || "Failed to load activities"}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
            <Button
              variant="outline"
              onClick={exportActivities}
              className="whitespace-nowrap"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          {/* Activity List */}
          <div className="h-[600px]">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-[120px] w-full" />
                ))}
              </div>
            ) : (
              <AnimatePresence>
                <AutoSizer>
                  {({ height, width }) => (
                    <List
                      ref={listRef}
                      height={height}
                      width={width}
                      itemCount={
                        Object.values(groupedActivities).reduce(
                          (acc, activities) => acc + activities.length,
                          0
                        )
                      }
                      itemSize={getItemSize}
                      overscanCount={OVERSCAN_COUNT}
                    >
                      {rowRenderer}
                    </List>
                  )}
                </AutoSizer>
              </AnimatePresence>
            )}
          </div>

          {/* Pagination */}
          {data?.pagination && (
            <PaginationControls
              currentPage={data.pagination.page}
              totalPages={data.pagination.totalPages}
              pageSize={data.pagination.limit}
              onPageChange={setPage}
              onPageSizeChange={setLimit}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
            />
          )}

          {/* Load more trigger */}
          <div ref={loadMoreRef} className="h-4" />
        </div>
      </CardContent>

      {/* Activity Detail Modal */}
      <ActivityDetailModal
        activity={selectedActivity}
        open={!!selectedActivity}
        onOpenChange={(open) => !open && setSelectedActivity(null)}
      />
    </Card>
  );
} 