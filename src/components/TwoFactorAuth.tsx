'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import QRCode from 'qrcode.react'

interface TwoFactorAuthProps {
    onSuccess?: () => void
    onCancel?: () => void
}

export default function TwoFactorAuth({ onSuccess, onCancel }: TwoFactorAuthProps) {
    const [step, setStep] = useState<'setup' | 'verify'>('setup')
    const [secret, setSecret] = useState('')
    const [qrCode, setQrCode] = useState('')
    const [code, setCode] = useState('')
    const [error, setError] = useState('')

    const handleSetup = async () => {
        try {
            const response = await fetch('/api/2fa/setup', {
                method: 'POST',
            })

            if (!response.ok) {
                throw new Error('Failed to setup 2FA')
            }

            const data = await response.json()
            setSecret(data.secret)
            setQrCode(data.qrCode)
            setStep('verify')
        } catch (error) {
            setError('Failed to setup 2FA. Please try again.')
        }
    }

    const handleVerify = async () => {
        try {
            const response = await fetch('/api/2fa/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code }),
            })

            if (!response.ok) {
                throw new Error('Invalid code')
            }

            onSuccess?.()
        } catch (error) {
            setError('Invalid code. Please try again.')
        }
    }

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6">Two-Factor Authentication</h2>

            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {step === 'setup' ? (
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Enable two-factor authentication to add an extra layer of security to your account.
                    </p>
                    <Button onClick={handleSetup} className="w-full">
                        Setup 2FA
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="text-center">
                        <QRCode value={qrCode} size={200} />
                        <p className="mt-2 text-sm text-gray-600">
                            Scan this QR code with your authenticator app
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="code">Verification Code</Label>
                        <Input
                            id="code"
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                        />
                    </div>

                    <div className="flex space-x-4">
                        <Button onClick={handleVerify} className="flex-1">
                            Verify
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setStep('setup')
                                setError('')
                                setCode('')
                            }}
                            className="flex-1"
                        >
                            Back
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
} 