import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { authenticator } from 'otplib'

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { code } = await req.json()

        // Get user's 2FA secret
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { twoFactorSecret: true }
        })

        if (!user?.twoFactorSecret) {
            return NextResponse.json({ error: '2FA not setup' }, { status: 400 })
        }

        // Verify the code
        const isValid = authenticator.verify({
            token: code,
            secret: user.twoFactorSecret
        })

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
        }

        // Enable 2FA for the user
        await prisma.user.update({
            where: { id: session.user.id },
            data: { twoFactorEnabled: true }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('2FA verify error:', error)
        return NextResponse.json({ error: 'Failed to verify 2FA' }, { status: 500 })
    }
} 