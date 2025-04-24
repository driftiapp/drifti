import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const [comments, total] = await Promise.all([
      prisma.themeComment.findMany({
        where: {
          themeId: params.id,
        },
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.themeComment.count({
        where: {
          themeId: params.id,
        },
      }),
    ])

    return NextResponse.json({
      comments,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

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

    const { content } = await request.json()

    // Validate content
    if (typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    const comment = await prisma.themeComment.create({
      data: {
        content: content.trim(),
        themeId: params.id,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get('commentId')

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      )
    }

    // Only allow users to delete their own comments
    const comment = await prisma.themeComment.findUnique({
      where: {
        id: commentId,
      },
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    if (comment.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this comment' },
        { status: 403 }
      )
    }

    await prisma.themeComment.delete({
      where: {
        id: commentId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
} 