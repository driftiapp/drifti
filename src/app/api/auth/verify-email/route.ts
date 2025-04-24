import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { env } from "@/lib/env"
import { Resend } from "resend"
import { SignJWT } from "jose"

const resend = new Resend(env.RESEND_API_KEY)

export async function POST(req: Request) {
    try {
        const { email } = await req.json()

        const user = await db.user.findUnique({
            where: { email },
        })

        if (!user) {
            return new NextResponse(
                JSON.stringify({ message: "User not found" }),
                { status: 404 }
            )
        }

        if (user.emailVerified) {
            return new NextResponse(
                JSON.stringify({ message: "Email already verified" }),
                { status: 400 }
            )
        }

        const token = await new SignJWT({ userId: user.id })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("24h")
            .sign(new TextEncoder().encode(env.NEXTAUTH_SECRET))

        const verificationUrl = `${env.NEXTAUTH_URL}/verify-email?token=${token}`

        await resend.emails.send({
            from: "noreply@yourdomain.com",
            to: email,
            subject: "Verify your email",
            html: `
                <h1>Verify your email</h1>
                <p>Click the link below to verify your email address:</p>
                <a href="${verificationUrl}">${verificationUrl}</a>
                <p>This link will expire in 24 hours.</p>
            `,
        })

        return new NextResponse(
            JSON.stringify({ message: "Verification email sent" }),
            { status: 200 }
        )
    } catch (error) {
        console.error("Error sending verification email:", error)
        return new NextResponse(
            JSON.stringify({ message: "Internal server error" }),
            { status: 500 }
        )
    }
} 