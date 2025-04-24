import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { PaymentMethod, PaymentProvider, PaymentStatus } from '@/types/payment'
import type { Stripe } from 'stripe'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const json = await request.json()
        const { paymentMethodData, amount, currency = 'USD', metadata = {} } = json

        if (!paymentMethodData || !amount) {
            return new NextResponse('Invalid request data', { status: 400 })
        }

        // Create a transaction record
        const transaction = await prisma.transaction.create({
            data: {
                userId: session.user.id,
                amount,
                currency,
                paymentMethod: PaymentMethod.GOOGLE_PAY,
                paymentProvider: PaymentProvider.GOOGLE_PAY,
                status: PaymentStatus.PENDING,
                metadata: metadata || null,
            },
        })

        // Create a payment method from the Google Pay token
        const paymentMethod = await stripe.paymentMethods.create({
            type: 'card',
            card: {
                token: paymentMethodData.tokenizationData.token
            }
        });

        // Create a payment intent with the payment method
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            payment_method: paymentMethod.id,
            payment_method_types: ['card'],
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            transactionId: transaction.id
        })
    } catch (error) {
        console.error('Google Pay processing error:', error)
        return new NextResponse('Payment processing failed', { status: 500 })
    }
} 