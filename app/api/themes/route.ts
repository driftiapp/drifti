import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const themes = await prisma.theme.findMany({
      where: {
        isPublic: true,
      },
      orderBy: {
        likes: 'desc',
      },
      take: 10,
    })
    return NextResponse.json(themes)
  } catch (error) {
    console.error('Error fetching themes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch themes' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { name, description, colors, isPublic } = await request.json()

    const theme = await prisma.theme.create({
      data: {
        name,
        description,
        colors,
        isPublic,
        userId: session.user.id,
      },
    })

    return NextResponse.json(theme)
  } catch (error) {
    console.error('Error creating theme:', error)
    return NextResponse.json(
      { error: 'Failed to create theme' },
      { status: 500 }
    )
  }
} 