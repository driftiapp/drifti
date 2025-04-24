'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Trash2, Search, Filter, Download } from 'lucide-react'
import { format as formatDate } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { DateRange } from 'react-day-picker'
import { LogAnalytics } from './LogAnalytics'

interface LogEntry {
    timestamp: number
    level: 'info' | 'warn' | 'error'
    message: string
    metadata?: Record<string, any>
}

interface AuthLogStats {
    totalLogs: number
    errorRate: number
    warningRate: number
    recentErrors: LogEntry[]
    recentWarnings: LogEntry[]
    userActivity: Record<string, number>
}

export function LogViewer() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [stats, setStats] = useState<AuthLogStats | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [levelFilter, setLevelFilter] = useState<LogEntry['level'] | 'all'>('all')
    const [dateRange, setDateRange] = useState<DateRange | undefined>()

    const fetchLogs = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/auth/logs')
            if (!response.ok) {
                throw new Error('Failed to fetch logs')
            }
            const data = await response.json()
            setLogs(data)
            setError(null)
        } catch (error) {
            setError('Failed to fetch logs')
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/auth/logs?stats=true')
            if (!response.ok) {
                throw new Error('Failed to fetch stats')
            }
            const data = await response.json()
            setStats(data)
        } catch (error) {
            setError('Failed to fetch stats')
        }
    }

    const clearLogs = async () => {
        try {
            const response = await fetch('/api/auth/logs', {
                method: 'DELETE',
            })
            if (!response.ok) {
                throw new Error('Failed to clear logs')
            }
            await fetchLogs()
            await fetchStats()
        } catch (error) {
            setError('Failed to clear logs')
        }
    }

    useEffect(() => {
        fetchLogs()
        fetchStats()
    }, [])

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch = searchQuery === '' ||
                log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                JSON.stringify(log.metadata || '').toLowerCase().includes(searchQuery.toLowerCase())

            const matchesLevel = levelFilter === 'all' || log.level === levelFilter

            const matchesDate = !dateRange?.from || !dateRange?.to || (
                log.timestamp >= dateRange.from.getTime() &&
                log.timestamp <= dateRange.to.getTime()
            )

            return matchesSearch && matchesLevel && matchesDate
        })
    }, [logs, searchQuery, levelFilter, dateRange])

    const getLevelColor = (level: LogEntry['level']) => {
        switch (level) {
            case 'error':
                return 'text-red-500'
            case 'warn':
                return 'text-yellow-500'
            case 'info':
                return 'text-blue-500'
            default:
                return 'text-gray-500'
        }
    }

    const exportLogs = async (format: 'csv' | 'json') => {
        try {
            const data = filteredLogs.map(log => ({
                timestamp: formatDate(log.timestamp, 'PPpp'),
                level: log.level,
                message: log.message,
                metadata: log.metadata ? JSON.stringify(log.metadata) : ''
            }))

            let content: string
            let filename: string
            let mimeType: string

            if (format === 'csv') {
                const headers = ['Timestamp', 'Level', 'Message', 'Metadata']
                const rows = data.map(log => [
                    log.timestamp,
                    log.level,
                    log.message,
                    log.metadata
                ])
                content = [headers, ...rows].map(row => row.join(',')).join('\n')
                filename = `auth-logs-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`
                mimeType = 'text/csv'
            } else {
                content = JSON.stringify(data, null, 2)
                filename = `auth-logs-${formatDate(new Date(), 'yyyy-MM-dd')}.json`
                mimeType = 'application/json'
            }

            const blob = new Blob([content], { type: mimeType })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            setError('Failed to export logs')
        }
    }

    if (loading) {
        return <div>Loading...</div>
    }

    return (
        <div className="space-y-4">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Auth Logs</h2>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportLogs('csv')}
                        className="flex items-center gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportLogs('json')}
                        className="flex items-center gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Export JSON
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={clearLogs}
                        className="flex items-center gap-2"
                    >
                        <Trash2 className="h-4 w-4" />
                        Clear Logs
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="logs">
                <TabsList>
                    <TabsTrigger value="logs">Logs</TabsTrigger>
                    <TabsTrigger value="stats">Statistics</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="logs">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Logs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                                        <Input
                                            placeholder="Search logs..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-8"
                                        />
                                    </div>
                                    <Select
                                        value={levelFilter}
                                        onValueChange={(value) => setLevelFilter(value as LogEntry['level'] | 'all')}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Filter by level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Levels</SelectItem>
                                            <SelectItem value="error">Error</SelectItem>
                                            <SelectItem value="warn">Warning</SelectItem>
                                            <SelectItem value="info">Info</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <DateRangePicker
                                        value={dateRange}
                                        onChange={setDateRange}
                                    />
                                </div>

                                <div className="space-y-4">
                                    {filteredLogs.map((log, index) => (
                                        <div
                                            key={index}
                                            className="p-4 border rounded-lg space-y-2"
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className={`font-medium ${getLevelColor(log.level)}`}>
                                                    {log.level.toUpperCase()}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {formatDate(log.timestamp, 'PPpp')}
                                                </span>
                                            </div>
                                            <p>{log.message}</p>
                                            {log.metadata && (
                                                <pre className="text-sm bg-gray-100 p-2 rounded">
                                                    {JSON.stringify(log.metadata, null, 2)}
                                                </pre>
                                            )}
                                        </div>
                                    ))}
                                    {filteredLogs.length === 0 && (
                                        <div className="text-center text-gray-500 py-8">
                                            No logs found matching your filters
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="stats">
                    <Card>
                        <CardHeader>
                            <CardTitle>Log Statistics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {stats && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-4 border rounded-lg">
                                            <h3 className="font-medium">Total Logs</h3>
                                            <p className="text-2xl">{stats.totalLogs}</p>
                                        </div>
                                        <div className="p-4 border rounded-lg">
                                            <h3 className="font-medium">Error Rate</h3>
                                            <p className="text-2xl text-red-500">
                                                {stats.errorRate.toFixed(1)}%
                                            </p>
                                        </div>
                                        <div className="p-4 border rounded-lg">
                                            <h3 className="font-medium">Warning Rate</h3>
                                            <p className="text-2xl text-yellow-500">
                                                {stats.warningRate.toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-medium">Recent Errors</h3>
                                        {stats.recentErrors.map((error, index) => (
                                            <div
                                                key={index}
                                                className="p-4 border rounded-lg space-y-2"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className="text-red-500 font-medium">
                                                        ERROR
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        {formatDate(error.timestamp, 'PPpp')}
                                                    </span>
                                                </div>
                                                <p>{error.message}</p>
                                                {error.metadata && (
                                                    <pre className="text-sm bg-gray-100 p-2 rounded">
                                                        {JSON.stringify(error.metadata, null, 2)}
                                                    </pre>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-medium">User Activity</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            {Object.entries(stats.userActivity).map(([userId, count]) => (
                                                <div
                                                    key={userId}
                                                    className="p-4 border rounded-lg"
                                                >
                                                    <h4 className="font-medium">User {userId}</h4>
                                                    <p className="text-2xl">{count} actions</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analytics">
                    <LogAnalytics logs={logs} />
                </TabsContent>
            </Tabs>
        </div>
    )
} 