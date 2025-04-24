"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"

export default function VerifyRequestPage() {
    return (
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">Check your email</CardTitle>
                    <CardDescription className="text-center">
                        A sign in link has been sent to your email address.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Icons.mail className="h-12 w-12 text-blue-500" />
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button
                        variant="outline"
                        onClick={() => window.location.href = "/auth/signin"}
                    >
                        Return to Sign In
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
} 