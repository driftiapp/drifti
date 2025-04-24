import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Driftix - Secure Secrets Management",
  description: "Secure secrets and backup management system",
}

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Welcome to Driftix</h1>
      <p className="text-xl text-gray-600">
        Secure secrets and backup management system
      </p>
    </main>
  )
} 