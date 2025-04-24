"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { toast } from "sonner"

export default function VerifyPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = useState(true)
    const [isVerified, setIsVerified] = useState(false)

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get("token")

            if (!token) {
                toast.error("Invalid verification link")
                router.push("/auth/signin" as const)
                return
            }

            try {
                const response = await fetch(`/api/auth/verify?token=${token}`)

                if (!response.ok) {
                    const error = await response.json()
                    throw new Error(error.message || "Something went wrong")
                }

                setIsVerified(true)
                toast.success("Email verified successfully")
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Something went wrong")
            } finally {
                setIsLoading(false)
            }
        }

        verifyEmail()
    }, [router, searchParams])

    return (
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">Email Verification</CardTitle>
                    <CardDescription className="text-center">
                        {isLoading
                            ? "Verifying your email..."
                            : isVerified
                                ? "Your email has been verified successfully!"
                                : "There was an error verifying your email."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    {isLoading ? (
                        <Icons.spinner className="h-12 w-12 animate-spin" />
                    ) : isVerified ? (
                        <Icons.check className="h-12 w-12 text-green-500" />
                    ) : (
                        <Icons.warning className="h-12 w-12 text-yellow-500" />
                    )}
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button
                        variant="outline"
                        onClick={() => router.push("/auth/signin" as const)}
                    >
                        Return to Sign In
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
} 