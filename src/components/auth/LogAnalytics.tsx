'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { format, subDays, eachDayOfInterval } from 'date-fns'

interface LogEntry {
    timestamp: number
    level: 'info' | 'warn' | 'error'
    message: string
    metadata?: Record<string, any>
}

interface LogAnalyticsProps {
    logs: LogEntry[]
}

const COLORS = {
    error: '#ef4444',
    warn: '#f59e0b',
    info: '#3b82f6'
}

export function LogAnalytics({ logs }: LogAnalyticsProps) {
    // Prepare time series data
    const timeSeriesData = useMemo(() => {
        const now = new Date()
        const days = eachDayOfInterval({
            start: subDays(now, 7),
            end: now
        })

        return days.map(day => {
            const dayStart = day.getTime()
            const dayEnd = dayStart + 24 * 60 * 60 * 1000

            const dayLogs = logs.filter(log =>
                log.timestamp >= dayStart && log.timestamp < dayEnd
            )

            return {
                date: format(day, 'MMM dd'),
                error: dayLogs.filter(log => log.level === 'error').length,
                warn: dayLogs.filter(log => log.level === 'warn').length,
                info: dayLogs.filter(log => log.level === 'info').length
            }
        })
    }, [logs])

    // Prepare level distribution data
    const levelDistribution = useMemo(() => {
        const counts = {
            error: logs.filter(log => log.level === 'error').length,
            warn: logs.filter(log => log.level === 'warn').length,
            info: logs.filter(log => log.level === 'info').length
        }

        return Object.entries(counts).map(([level, count]) => ({
            name: level.toUpperCase(),
            value: count
        }))
    }, [logs])

    // Prepare hourly distribution data
    const hourlyDistribution = useMemo(() => {
        const hourlyCounts = Array(24).fill(0)

        logs.forEach(log => {
            const hour = new Date(log.timestamp).getHours()
            hourlyCounts[hour]++
        })

        return hourlyCounts.map((count, hour) => ({
            hour: `${hour}:00`,
            count
        }))
    }, [logs])

    return (
        <div className="space-y-4">
            <Tabs defaultValue="time-series">
                <TabsList>
                    <TabsTrigger value="time-series">Time Series</TabsTrigger>
                    <TabsTrigger value="distribution">Distribution</TabsTrigger>
                    <TabsTrigger value="hourly">Hourly</TabsTrigger>
                </TabsList>

                <TabsContent value="time-series">
                    <Card>
                        <CardHeader>
                            <CardTitle>Log Activity Over Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={timeSeriesData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="error"
                                            stroke={COLORS.error}
                                            name="Errors"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="warn"
                                            stroke={COLORS.warn}
                                            name="Warnings"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="info"
                                            stroke={COLORS.info}
                                            name="Info"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="distribution">
                    <Card>
                        <CardHeader>
                            <CardTitle>Log Level Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={levelDistribution}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={150}
                                            label
                                        >
                                            {levelDistribution.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="hourly">
                    <Card>
                        <CardHeader>
                            <CardTitle>Hourly Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={hourlyDistribution}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="hour" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="count" fill={COLORS.info} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
} 