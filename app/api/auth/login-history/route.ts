import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // In a real implementation, this would fetch from your database
    const loginHistory = [
      {
        id: '1',
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
        location: 'New York, NY',
        device: 'MacBook Pro',
        status: 'success',
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        ipAddress: '192.168.1.2',
        location: 'San Francisco, CA',
        device: 'iPhone 13',
        status: 'failed',
        reason: 'Invalid password',
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        ipAddress: '192.168.1.3',
        location: 'London, UK',
        device: 'Windows PC',
        status: 'success',
      },
    ]

    return NextResponse.json({ loginHistory })
  } catch (error) {
    console.error('Error fetching login history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch login history' },
      { status: 500 }
    )
  }
} 