"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"

export default function SignOutPage() {
    const router = useRouter()

    useEffect(() => {
        const handleSignOut = async () => {
            await signOut({ redirect: false })
            router.push("/auth/signin" as const)
        }

        handleSignOut()
    }, [router])

    return (
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">Signing out</CardTitle>
                    <CardDescription className="text-center">
                        Please wait while we sign you out...
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Icons.spinner className="h-12 w-12 animate-spin" />
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