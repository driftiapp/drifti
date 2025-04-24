import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Generate a new secret
        const secret = authenticator.generateSecret()

        // Generate QR code
        const otpauth = authenticator.keyuri(
            session.user.email || 'user',
            'Driftix',
            secret
        )

        const qrCode = await QRCode.toDataURL(otpauth)

        // Save the secret to the user's account
        await prisma.user.update({
            where: { id: session.user.id },
            data: { twoFactorSecret: secret }
        })

        return NextResponse.json({ secret, qrCode })
    } catch (error) {
        console.error('2FA setup error:', error)
        return NextResponse.json({ error: 'Failed to setup 2FA' }, { status: 500 })
    }
} 