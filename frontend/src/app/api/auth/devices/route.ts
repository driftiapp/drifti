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
    const devices = [
      {
        id: '1',
        name: 'MacBook Pro',
        type: 'Desktop',
        lastActive: new Date(),
        location: 'New York, NY',
        isCurrent: true,
      },
      {
        id: '2',
        name: 'iPhone 13',
        type: 'Mobile',
        lastActive: new Date(Date.now() - 3600000), // 1 hour ago
        location: 'San Francisco, CA',
        isCurrent: false,
      },
    ]

    return NextResponse.json({ devices })
  } catch (error) {
    console.error('Error fetching devices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch devices' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('id')

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      )
    }

    // In a real implementation, this would delete from your database
    // and revoke any active sessions for this device

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error revoking device:', error)
    return NextResponse.json(
      { error: 'Failed to revoke device' },
      { status: 500 }
    )
  }
} 