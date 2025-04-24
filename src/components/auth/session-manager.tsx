'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

interface Session {
    id: string
    sessionToken: string
    expires: string
    user: {
        name: string | null
        email: string
    }
}

export function SessionManager() {
    const [sessions, setSessions] = useState<Session[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchSessions()
    }, [])

    async function fetchSessions() {
        try {
            const response = await fetch("/api/auth/sessions")
            if (!response.ok) {
                throw new Error("Failed to fetch sessions")
            }
            const data = await response.json()
            setSessions(data)
        } catch (error) {
            setError("Failed to load sessions")
        } finally {
            setIsLoading(false)
        }
    }

    async function deleteSession(sessionId: string) {
        try {
            const response = await fetch("/api/auth/sessions", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ sessionId }),
            })

            if (!response.ok) {
                throw new Error("Failed to delete session")
            }

            setSessions(sessions.filter(session => session.id !== sessionId))
        } catch (error) {
            setError("Failed to delete session")
        }
    }

    if (isLoading) {
        return <div>Loading sessions...</div>
    }

    if (error) {
        return <div className="text-destructive">{error}</div>
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Active Sessions</h2>
            <div className="grid gap-4">
                {sessions.map(session => (
                    <div
                        key={session.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                    >
                        <div>
                            <p className="font-medium">{session.user.name || session.user.email}</p>
                            <p className="text-sm text-muted-foreground">
                                Expires: {new Date(session.expires).toLocaleString()}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSession(session.id)}
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
} 