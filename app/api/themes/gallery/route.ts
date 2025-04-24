import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const category = searchParams.get('category')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const order = searchParams.get('order') || 'desc'
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where = {
      isPublic: true,
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    // Get total count for pagination
    const total = await prisma.theme.count({ where })

    // Get themes with ratings and comments
    const themes = await prisma.theme.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: order,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        ratings: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            comments: true,
            ratings: true,
          },
        },
      },
    })

    // Calculate average rating for each theme
    const themesWithAvgRating = themes.map(theme => {
      const ratings = theme.ratings.map(r => r.rating)
      const avgRating = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0

      return {
        ...theme,
        avgRating,
        totalRatings: theme._count.ratings,
        totalComments: theme._count.comments,
        ratings: undefined, // Remove raw ratings from response
        _count: undefined, // Remove count from response
      }
    })

    return NextResponse.json({
      themes: themesWithAvgRating,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    })
  } catch (error) {
    console.error('Error fetching theme gallery:', error)
    return NextResponse.json(
      { error: 'Failed to fetch theme gallery' },
      { status: 500 }
    )
  }
} 