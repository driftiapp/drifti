import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Role } from "@/types/auth"

export async function requireAuth(allowedRoles?: Role[]) {
    const session = await auth()

    if (!session) {
        redirect("/login")
    }

    if (allowedRoles && !allowedRoles.includes(session.user.role)) {
        redirect("/unauthorized")
    }

    return session
}

export async function requireAdmin() {
    return requireAuth([Role.ADMIN])
}

export async function requireBusinessOwner() {
    return requireAuth([Role.BUSINESS_OWNER])
}

export async function requireDriver() {
    return requireAuth([Role.DRIVER])
}

export async function requireCustomerSupport() {
    return requireAuth([Role.CUSTOMER_SUPPORT])
} 