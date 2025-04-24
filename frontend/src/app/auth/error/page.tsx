import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const getErrorMessage = (error: string) => {
    switch (error) {
      case "CredentialsSignin":
        return "Invalid email or password"
      case "SessionRequired":
        return "Please sign in to access this page"
      case "AccessDenied":
        return "You don't have permission to access this page"
      default:
        return "An error occurred during authentication"
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-red-600">Authentication Error</h2>
          <p className="mt-2 text-sm text-gray-600">
            There was a problem with your authentication
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {searchParams.error 
              ? getErrorMessage(searchParams.error)
              : "An unknown error occurred"}
          </AlertDescription>
        </Alert>

        <div className="flex justify-center space-x-4">
          <Button asChild>
            <Link href="/auth/signin">
              Try Again
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 