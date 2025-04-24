"use client"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Users, DollarSign, Activity, TrendingUp } from "lucide-react"
import { MetricCard } from "@/components/ui/metric-card"
import { DataTable } from "@/components/DataTable"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { ExportButton } from "@/components/ui/export-button"
import { useState } from "react"
import { DateRange } from "react-day-picker"

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <MetricCard
          title="Total Users"
          value="1,234"
          icon={Users}
          trend={{ value: 12, label: "from last month" }}
        />
        <MetricCard
          title="Revenue"
          value="$12,345"
          icon={DollarSign}
          trend={{ value: 8, label: "from last month" }}
        />
        <MetricCard
          title="Active Users"
          value="789"
          icon={Activity}
          trend={{ value: 5, label: "from last month" }}
        />
        <MetricCard
          title="Growth Rate"
          value="15%"
          icon={TrendingUp}
          trend={{ value: 3, label: "from last month" }}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <div className="flex items-center space-x-4">
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
            />
            <ExportButton
              onExport={async (format) => {
                // Implement export functionality
                console.log(`Exporting data in ${format} format`)
              }}
            />
          </div>
        </div>
        <DataTable
          endpoint="/api/users"
          columns={[
            { key: "name", label: "Name", filterType: "text" },
            { key: "email", label: "Email", filterType: "text" },
            { 
              key: "status", 
              label: "Status", 
              filterType: "multi-select",
              filterOptions: [
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "pending", label: "Pending" },
              ]
            },
            { key: "createdAt", label: "Created At", filterType: "date" },
          ]}
        />
      </div>
    </div>
  )
} 