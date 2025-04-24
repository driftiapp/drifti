import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Theme validation schema
const themeSchema = z.enum(['light', 'dark', 'sepia', 'high-contrast', 'rider', 'driver', 'owner'])

export async function PATCH(req: Request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await req.json()
    const theme = themeSchema.parse(body.theme)

    // Update user theme
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { theme },
      select: { theme: true }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating theme:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid theme value' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user theme
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { theme: true }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error getting theme:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 