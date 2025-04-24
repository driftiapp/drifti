import { NextResponse } from 'next/server'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

export async function POST() {
  try {
    // Generate a new secret
    const secret = authenticator.generateSecret()
    
    // Create the OTP Auth URL
    const otpauth = authenticator.keyuri(
      'user@example.com', // This should be the user's email
      'Driftix', // Your app name
      secret
    )
    
    // Generate QR code
    const qrCode = await QRCode.toDataURL(otpauth)
    
    return NextResponse.json({ secret, qrCode })
  } catch (error) {
    console.error('Error generating 2FA secret:', error)
    return NextResponse.json(
      { error: 'Failed to generate 2FA secret' },
      { status: 500 }
    )
  }
} 