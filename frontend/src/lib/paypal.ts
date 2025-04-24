import { PaymentStatus } from "@/types/payment"
import { prisma } from "./prisma"

export async function capturePayPalOrder(orderId: string) {
    // Implementation will depend on your PayPal integration
    throw new Error("Not implemented")
}

export async function updatePayPalTransactionStatus(
    transactionId: string,
    status: PaymentStatus
) {
    return prisma.transaction.update({
        where: { id: transactionId },
        data: { status },
    })
} 