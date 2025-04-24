'use client'

import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { SocialLoginButtons } from "@/components/ui/social-login-buttons"
import Link from "next/link"
import { handleSignIn } from "./actions"

export default function SignInPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        {searchParams.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {searchParams.error === "CredentialsSignin"
                ? "Invalid email or password"
                : "An error occurred during sign in"}
            </AlertDescription>
          </Alert>
        )}

        <SocialLoginButtons />

        <form
          action={handleSignIn}
          className="space-y-6"
        >
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
              autoComplete="current-password"
              required
            />
          </div>

          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>

        <div className="text-center text-sm text-gray-600">
          <p>
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </p>
          <div className="mt-2 space-y-1">
            <p>Demo accounts:</p>
            <p>Admin: admin@driftix.com / admin123</p>
            <p>Driver: driver@driftix.com / driver123</p>
            <p>Business: business@driftix.com / business123</p>
          </div>
        </div>
      </div>
    </div>
  )
} 