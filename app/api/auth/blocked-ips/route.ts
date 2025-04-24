import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface BlockIPRequest {
  ipAddress: string
  reason: string
  duration?: number // Duration in milliseconds, null for permanent
}

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
    const blockedIPs = [
      {
        id: '1',
        ipAddress: '192.168.1.1',
        reason: 'Multiple failed login attempts',
        blockedAt: new Date(Date.now() - 3600000), // 1 hour ago
        expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
      },
      {
        id: '2',
        ipAddress: '10.0.0.1',
        reason: 'Known malicious activity',
        blockedAt: new Date(Date.now() - 86400000), // 1 day ago
        expiresAt: null, // Permanent block
      },
    ]

    return NextResponse.json({ blockedIPs })
  } catch (error) {
    console.error('Error fetching blocked IPs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blocked IPs' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: BlockIPRequest = await request.json()
    const { ipAddress, reason, duration } = body

    if (!ipAddress || !reason) {
      return NextResponse.json(
        { error: 'IP address and reason are required' },
        { status: 400 }
      )
    }

    // Validate IP address format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRegex.test(ipAddress)) {
      return NextResponse.json(
        { error: 'Invalid IP address format' },
        { status: 400 }
      )
    }

    // In a real implementation, this would:
    // 1. Check if IP is already blocked
    // 2. Add to database
    // 3. Update security logs
    // 4. Trigger any necessary notifications

    const blockedIP = {
      id: Math.random().toString(36).substr(2, 9), // Temporary ID generation
      ipAddress,
      reason,
      blockedAt: new Date(),
      expiresAt: duration ? new Date(Date.now() + duration) : null,
    }

    return NextResponse.json({ blockedIP }, { status: 201 })
  } catch (error) {
    console.error('Error blocking IP:', error)
    return NextResponse.json(
      { error: 'Failed to block IP' },
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
    const ipId = searchParams.get('id')

    if (!ipId) {
      return NextResponse.json(
        { error: 'IP ID is required' },
        { status: 400 }
      )
    }

    // In a real implementation, this would remove the IP from your blocked list
    // and potentially update related security records

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unblocking IP:', error)
    return NextResponse.json(
      { error: 'Failed to unblock IP' },
      { status: 500 }
    )
  }
} 