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
    const activities = [
      {
        id: '1',
        timestamp: new Date(),
        type: 'unusual_location',
        details: 'Login attempt from a new location (London, UK)',
        severity: 'medium',
        resolved: false,
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        type: 'multiple_failures',
        details: '5 failed login attempts from the same IP address',
        severity: 'high',
        resolved: false,
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        type: 'suspicious_ip',
        details: 'Login attempt from a known malicious IP address',
        severity: 'high',
        resolved: true,
      },
    ]

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Error fetching suspicious activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suspicious activities' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const { activityId } = Object.fromEntries(searchParams)
    const { resolved } = await request.json()

    if (!activityId) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      )
    }

    // Update the activity status
    // This is a mock implementation - replace with actual database update
    const updatedActivity = {
      id: activityId,
      resolved: resolved,
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json(updatedActivity)
  } catch (error) {
    console.error('Error updating suspicious activity:', error)
    return NextResponse.json(
      { error: 'Failed to update suspicious activity' },
      { status: 500 }
    )
  }
} 