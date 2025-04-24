import { PaymentStatus } from "@/types/payment"
import { prisma } from "./prisma"

interface GooglePayConfig {
    merchantId: string
    merchantName: string
    environment: 'TEST' | 'PRODUCTION'
}

const config: GooglePayConfig = {
    merchantId: process.env.GOOGLE_PAY_MERCHANT_ID || '',
    merchantName: process.env.GOOGLE_PAY_MERCHANT_NAME || 'Driftix',
    environment: (process.env.NODE_ENV === 'production') ? 'PRODUCTION' : 'TEST'
}

export async function initGooglePay() {
    if (!config.merchantId) {
        throw new Error("Missing GOOGLE_PAY_MERCHANT_ID")
    }

    return {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [{
            type: 'CARD',
            parameters: {
                allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                allowedCardNetworks: ['AMEX', 'DISCOVER', 'MASTERCARD', 'VISA']
            },
            tokenizationSpecification: {
                type: 'PAYMENT_GATEWAY',
                parameters: {
                    gateway: 'stripe',
                    'stripe:version': '2025-03-31.basil',
                    'stripe:publishableKey': process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
                }
            }
        }],
        merchantInfo: {
            merchantId: config.merchantId,
            merchantName: config.merchantName
        }
    }
}

export async function processGooglePayPayment(paymentData: any) {
    try {
        const { paymentMethodData } = paymentData

        // Create a payment intent using the token
        const response = await fetch('/api/payment/googlepay/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentMethodData })
        })

        if (!response.ok) {
            throw new Error('Payment processing failed')
        }

        return await response.json()
    } catch (error) {
        console.error('Google Pay payment error:', error)
        throw error
    }
}

export async function updateGooglePayTransactionStatus(
    transactionId: string,
    status: PaymentStatus,
    metadata?: Record<string, any>
) {
    return prisma.transaction.update({
        where: { id: transactionId },
        data: {
            status,
            metadata: metadata || undefined
        },
    })
} 