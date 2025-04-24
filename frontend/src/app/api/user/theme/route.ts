import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { theme: true }
        })

        return NextResponse.json({ theme: user?.theme || 'system' })
    } catch (error) {
        console.error('Error fetching user theme:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { theme } = await request.json()
        if (!theme || !['light', 'dark', 'system'].includes(theme)) {
            return new NextResponse('Invalid theme', { status: 400 })
        }

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: { theme },
            select: { theme: true }
        })

        return NextResponse.json({ theme: user.theme })
    } catch (error) {
        console.error('Error updating user theme:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
} 