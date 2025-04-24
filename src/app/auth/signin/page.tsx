"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { toast } from "sonner"

export default function SignInPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                toast.error("Invalid email or password")
                return
            }

            router.push("/dashboard")
            router.refresh()
        } catch (error) {
            toast.error("Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSocialSignIn = async (provider: string) => {
        setIsLoading(true)
        try {
            await signIn(provider, { callbackUrl: "/dashboard" })
        } catch (error) {
            toast.error("Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
                    <CardDescription className="text-center">
                        Choose your preferred sign in method
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            variant="outline"
                            onClick={() => handleSocialSignIn("google")}
                            disabled={isLoading}
                        >
                            <Icons.google className="mr-2 h-4 w-4" />
                            Google
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleSocialSignIn("github")}
                            disabled={isLoading}
                        >
                            <Icons.gitHub className="mr-2 h-4 w-4" />
                            GitHub
                        </Button>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-2">
                            <div className="grid gap-1">
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
                            <div className="grid gap-1">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && (
                                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Sign In
                            </Button>
                        </div>
                    </form>
                </CardContent>
                <CardFooter>
                    <p className="text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Button
                            variant="link"
                            className="px-0"
                            onClick={() => router.push("/auth/register")}
                        >
                            Sign up
                        </Button>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
} 