'use client'

import { useState } from "react"
import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { SocialLoginButtons } from "@/components/ui/social-login-buttons"
import Link from "next/link"

export default function SignUpPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const email = formData.get("email") as string
      const password = formData.get("password") as string
      const confirmPassword = formData.get("confirmPassword") as string
      const name = formData.get("name") as string

      // Basic validation
      if (!email || !password || !confirmPassword || !name) {
        setError("All fields are required")
        return
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match")
        return
      }

      if (password.length < 8) {
        setError("Password must be at least 8 characters long")
        return
      }

      // Register user
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account")
      }

      // Sign in the user after successful registration
      await signIn("credentials", {
        email,
        password,
        redirectTo: "/dashboard"
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during sign up")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Create an account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign up to get started
          </p>
        </div>

        {(error || searchParams.error) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 
                (searchParams.error === "CredentialsSignin" 
                  ? "Invalid email or password"
                  : "An error occurred during sign up")}
            </AlertDescription>
          </Alert>
        )}

        <SocialLoginButtons />

        <form
          action={handleSubmit}
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Sign up"}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-600">
          <p>
            Already have an account?{" "}
            <Link 
              href="/auth/signin" 
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 