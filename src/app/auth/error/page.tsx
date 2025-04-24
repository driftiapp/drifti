"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"

export default function AuthErrorPage() {
    const searchParams = useSearchParams()
    const error = searchParams.get("error")

    const getErrorMessage = (error: string | null) => {
        switch (error) {
            case "Configuration":
                return "There is a problem with the server configuration."
            case "AccessDenied":
                return "You do not have permission to sign in."
            case "Verification":
                return "The verification link is invalid or has expired."
            case "OAuthSignin":
                return "Error in the OAuth sign-in process."
            case "OAuthCallback":
                return "Error in the OAuth callback process."
            case "OAuthCreateAccount":
                return "Could not create OAuth provider user."
            case "EmailCreateAccount":
                return "Could not create email provider user."
            case "Callback":
                return "Error in the OAuth callback process."
            case "OAuthAccountNotLinked":
                return "Email already exists with different credentials."
            case "EmailSignin":
                return "Check your email for the sign-in link."
            case "CredentialsSignin":
                return "Sign in failed. Check your credentials."
            case "SessionRequired":
                return "Please sign in to access this page."
            default:
                return "An error occurred during authentication."
        }
    }

    return (
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">Authentication Error</CardTitle>
                    <CardDescription className="text-center">
                        {getErrorMessage(error)}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Icons.warning className="h-12 w-12 text-yellow-500" />
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