"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"

interface SessionManagerProps {
    children: React.ReactNode
    requireAuth?: boolean
}

export function SessionManager({ children, requireAuth = false }: SessionManagerProps) {
    const { data: session, status } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (requireAuth && status === "unauthenticated") {
            toast.error("Please sign in to access this page")
            router.push("/auth/signin" as const)
        }
    }, [requireAuth, status, router])

    if (requireAuth && status === "loading") {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    return <>{children}</>
} 