import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { rating } = await request.json()

    // Validate rating
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid rating. Must be a number between 1 and 5' },
        { status: 400 }
      )
    }

    // Upsert rating (create or update)
    const themeRating = await prisma.themeRating.upsert({
      where: {
        themeId_userId: {
          themeId: params.id,
          userId: session.user.id,
        },
      },
      update: {
        rating,
      },
      create: {
        themeId: params.id,
        userId: session.user.id,
        rating,
      },
    })

    // Get updated average rating
    const ratings = await prisma.themeRating.findMany({
      where: {
        themeId: params.id,
      },
      select: {
        rating: true,
      },
    })

    const avgRating = ratings.length > 0
      ? ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / ratings.length
      : 0

    return NextResponse.json({
      rating: themeRating,
      avgRating,
      totalRatings: ratings.length,
    })
  } catch (error) {
    console.error('Error rating theme:', error)
    return NextResponse.json(
      { error: 'Failed to rate theme' },
      { status: 500 }
    )
  }
} 