import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { name, colors } = body

    if (!name || !colors) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const theme = await prisma.customTheme.create({
      data: {
        name,
        colors,
        userId: session.user.id,
      },
    })

    return NextResponse.json(theme)
  } catch (error) {
    console.error('Error saving custom theme:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const themes = await prisma.customTheme.findMany({
      where: {
        userId: session.user.id,
      },
    })

    return NextResponse.json(themes)
  } catch (error) {
    console.error('Error fetching custom themes:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 