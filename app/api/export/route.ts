import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { format: exportFormat, dateRange } = await req.json()

        // Get data based on date range
        const startDate = dateRange?.from ? new Date(dateRange.from) : new Date(0)
        const endDate = dateRange?.to ? new Date(dateRange.to) : new Date()

        const data = await prisma.user.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                status: true
            }
        })

        let exportData: string
        let contentType: string

        switch (exportFormat) {
            case 'csv':
                exportData = convertToCSV(data)
                contentType = 'text/csv'
                break
            case 'json':
                exportData = JSON.stringify(data, null, 2)
                contentType = 'application/json'
                break
            default:
                return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
        }

        return new NextResponse(exportData, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="export-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}"`
            }
        })
    } catch (error) {
        console.error('Export error:', error)
        return NextResponse.json({ error: 'Export failed' }, { status: 500 })
    }
}

function convertToCSV(data: any[]) {
    const headers = Object.keys(data[0])
    const csvRows = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header]
                return typeof value === 'string' ? `"${value}"` : value
            }).join(',')
        )
    ]
    return csvRows.join('\n')
} 