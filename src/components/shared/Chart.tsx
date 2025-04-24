'use client'

import { ReactNode } from 'react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    ChartData,
    ChartOptions,
} from 'chart.js'
import { Line, Bar, Pie, Radar, Scatter } from 'react-chartjs-2'
import { LoadingState } from './LoadingState'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend
)

type ChartType = 'line' | 'bar' | 'pie' | 'radar' | 'scatter'

interface ChartProps<T extends ChartType> {
    type: T
    data: ChartData<T>
    options?: ChartOptions<T>
    isLoading?: boolean
    error?: string
    className?: string
    height?: number
}

export function Chart<T extends ChartType>({
    type,
    data,
    options = {},
    isLoading,
    error,
    className = '',
    height = 300,
}: ChartProps<T>) {
    const defaultOptions: ChartOptions<T> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            },
        },
        ...options,
    }

    if (isLoading) {
        return (
            <div className={`flex h-[${height}px] items-center justify-center ${className}`}>
                <LoadingState />
            </div>
        )
    }

    if (error) {
        return (
            <div className={`flex h-[${height}px] items-center justify-center text-destructive ${className}`}>
                {error}
            </div>
        )
    }

    const renderChart = () => {
        switch (type) {
            case 'line':
                return <Line data={data as ChartData<'line'>} options={defaultOptions as ChartOptions<'line'>} />
            case 'bar':
                return <Bar data={data as ChartData<'bar'>} options={defaultOptions as ChartOptions<'bar'>} />
            case 'pie':
                return <Pie data={data as ChartData<'pie'>} options={defaultOptions as ChartOptions<'pie'>} />
            case 'radar':
                return <Radar data={data as ChartData<'radar'>} options={defaultOptions as ChartOptions<'radar'>} />
            case 'scatter':
                return <Scatter data={data as ChartData<'scatter'>} options={defaultOptions as ChartOptions<'scatter'>} />
            default:
                return null
        }
    }

    return (
        <div className={`h-[${height}px] ${className}`}>
            {renderChart()}
        </div>
    )
} 