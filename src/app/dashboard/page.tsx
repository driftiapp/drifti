import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { SessionManager } from "@/components/auth/session-manager"

export default async function DashboardPage() {
    const session = await auth()

    if (!session) {
        redirect("/login")
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Dashboard</h1>
                <SignOutButton />
            </div>
            <div className="grid gap-6">
                <div className="rounded-lg border p-4">
                    <h2 className="text-xl font-semibold mb-2">Welcome back, {session.user.name}!</h2>
                    <p className="text-muted-foreground">
                        You are logged in as {session.user.email} with role: {session.user.role}
                    </p>
                </div>
                <div className="rounded-lg border p-4">
                    <SessionManager />
                </div>
            </div>
        </div>
    )
} 