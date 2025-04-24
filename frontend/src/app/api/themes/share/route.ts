import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const shareThemeSchema = z.object({
  name: z.string().min(1).max(50),
  colors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    background: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    text: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    border: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }),
  isPublic: z.boolean().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const validatedData = shareThemeSchema.parse(body)

    const theme = await prisma.sharedTheme.create({
      data: {
        name: validatedData.name,
        colors: validatedData.colors,
        isPublic: validatedData.isPublic ?? true,
        userId: session.user.id,
        shareCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
      },
    })

    return NextResponse.json(theme)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 })
    }
    console.error('Error sharing theme:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const shareCode = searchParams.get('code')

    if (!shareCode) {
      return new NextResponse('Share code is required', { status: 400 })
    }

    const theme = await prisma.sharedTheme.findFirst({
      where: {
        shareCode,
        isPublic: true,
      },
    })

    if (!theme) {
      return new NextResponse('Theme not found', { status: 404 })
    }

    return NextResponse.json(theme)
  } catch (error) {
    console.error('Error fetching shared theme:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 