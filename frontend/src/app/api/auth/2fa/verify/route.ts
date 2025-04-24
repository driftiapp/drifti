import { NextResponse } from 'next/server'
import { authenticator } from 'otplib'

export async function POST(request: Request) {
  try {
    const { code, secret } = await request.json()

    // Verify the code
    const isValid = authenticator.verify({
      token: code,
      secret,
    })

    if (!isValid) {
      return NextResponse.json(
        { valid: false, error: 'Invalid code' },
        { status: 400 }
      )
    }

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => {
      return Math.random().toString(36).substring(2, 8).toUpperCase()
    })

    return NextResponse.json({
      valid: true,
      backupCodes,
    })
  } catch (error) {
    console.error('Error verifying 2FA code:', error)
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    )
  }
} 