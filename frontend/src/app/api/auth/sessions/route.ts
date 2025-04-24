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
    const sessions = [
      {
        id: '1',
        device: {
          id: '1',
          name: 'MacBook Pro',
          type: 'Desktop',
          lastActive: new Date(),
          location: 'New York, NY',
          isCurrent: true,
        },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        lastActive: new Date(),
      },
      {
        id: '2',
        device: {
          id: '2',
          name: 'iPhone 13',
          type: 'Mobile',
          lastActive: new Date(Date.now() - 3600000), // 1 hour ago
          location: 'San Francisco, CA',
          isCurrent: false,
        },
        ipAddress: '192.168.1.2',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        createdAt: new Date(Date.now() - 172800000), // 2 days ago
        lastActive: new Date(Date.now() - 3600000), // 1 hour ago
      },
    ]

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
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
    const sessionId = searchParams.get('id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // In a real implementation, this would delete from your database
    // and invalidate the session

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error revoking session:', error)
    return NextResponse.json(
      { error: 'Failed to revoke session' },
      { status: 500 }
    )
  }
} 