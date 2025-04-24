"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { toast } from "sonner"

export default function ResetPasswordPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || "Something went wrong")
            }

            toast.success("Password reset email sent")
            router.push("/auth/verify-request" as const)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">Reset your password</CardTitle>
                    <CardDescription className="text-center">
                        Enter your email address and we&apos;ll send you a link to reset your password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && (
                                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Send Reset Link
                            </Button>
                        </div>
                    </form>
                </CardContent>
                <CardFooter>
                    <p className="text-center text-sm text-muted-foreground">
                        Remember your password?{" "}
                        <Button
                            variant="link"
                            className="px-0"
                            onClick={() => router.push("/auth/signin" as const)}
                        >
                            Sign in
                        </Button>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
} 