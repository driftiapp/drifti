import Stripe from "stripe"
import { PaymentStatus } from "@/types/payment"
import { prisma } from "./prisma"

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-03-31.basil",
})

export async function updateTransactionStatus(
    transactionId: string,
    status: PaymentStatus
) {
    return prisma.transaction.update({
        where: { id: transactionId },
        data: { status },
    })
}