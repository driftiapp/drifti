import { requireAdmin } from "@/lib/auth-guard"
import { SignOutButton } from "@/components/auth/sign-out-button"

export default async function AdminPage() {
    const session = await requireAdmin()

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Admin Dashboard</h1>
                <SignOutButton />
            </div>
            <div className="grid gap-6">
                <div className="rounded-lg border p-4">
                    <h2 className="text-xl font-semibold mb-2">Welcome, {session.user.name}!</h2>
                    <p className="text-muted-foreground">
                        You have access to the admin dashboard with role: {session.user.role}
                    </p>
                </div>
                <div className="rounded-lg border p-4">
                    <h2 className="text-xl font-semibold mb-4">Admin Actions</h2>
                    <div className="grid gap-4">
                        <button className="btn btn-primary">Manage Users</button>
                        <button className="btn btn-primary">View Analytics</button>
                        <button className="btn btn-primary">System Settings</button>
                    </div>
                </div>
            </div>
        </div>
    )
} 