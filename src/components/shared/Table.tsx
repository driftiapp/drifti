'use client'

import { ReactNode, useState } from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { LoadingState } from './LoadingState'
import { Button } from '@/components/ui/button'

interface Column<T> {
    header: string
    accessor: keyof T | ((item: T) => ReactNode)
    sortable?: boolean
    className?: string
}

interface TableProps<T extends Record<string, any>> {
    data: T[]
    columns: Column<T>[]
    isLoading?: boolean
    onSort?: (field: keyof T, direction: 'asc' | 'desc') => void
    sortField?: keyof T
    sortDirection?: 'asc' | 'desc'
    className?: string
}

export function Table<T extends Record<string, any>>({
    data,
    columns,
    isLoading,
    onSort,
    sortField,
    sortDirection,
    className = '',
}: TableProps<T>) {
    const [page, setPage] = useState(1)
    const pageSize = 10
    const totalPages = Math.ceil(data.length / pageSize)
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const currentData = data.slice(start, end)

    const handleSort = (field: keyof T) => {
        if (!onSort) return
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
        onSort(field, direction)
    }

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="relative overflow-x-auto rounded-lg border">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-xs uppercase">
                        <tr>
                            {columns.map((column, index) => (
                                <th
                                    key={index}
                                    className={`px-4 py-3 ${column.className || ''}`}
                                >
                                    {column.sortable ? (
                                        <Button
                                            variant="ghost"
                                            className="flex items-center gap-1"
                                            onClick={() => handleSort(column.accessor as keyof T)}
                                        >
                                            {column.header}
                                            {sortField === column.accessor && (
                                                sortDirection === 'asc' ? (
                                                    <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4" />
                                                )
                                            )}
                                            {sortField !== column.accessor && (
                                                <ChevronsUpDown className="h-4 w-4" />
                                            )}
                                        </Button>
                                    ) : (
                                        column.header
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8">
                                    <LoadingState />
                                </td>
                            </tr>
                        ) : currentData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                                    No data available
                                </td>
                            </tr>
                        ) : (
                            currentData.map((item, rowIndex) => (
                                <tr
                                    key={rowIndex}
                                    className="border-b transition-colors hover:bg-muted/50"
                                >
                                    {columns.map((column, colIndex) => (
                                        <td key={colIndex} className={`px-4 py-3 ${column.className || ''}`}>
                                            {typeof column.accessor === 'function'
                                                ? column.accessor(item)
                                                : String(item[column.accessor])}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing {start + 1} to {Math.min(end, data.length)} of {data.length} entries
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page + 1)}
                            disabled={page === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
} 