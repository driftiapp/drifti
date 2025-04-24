import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { env } from "@/lib/env"
import { Resend } from "resend"
import { SignJWT } from "jose"
import { hash } from "bcrypt"
import { jwtVerify } from "jose"
import { sendPasswordResetEmail } from "@/lib/email"
import { z } from "zod"

const resend = new Resend(env.RESEND_API_KEY)

const resetSchema = z.object({
    email: z.string().email("Invalid email address"),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { email } = resetSchema.parse(body)

        // Check if user exists
        const user = await db.user.findUnique({
            where: { email },
        })

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            )
        }

        // Generate reset token
        const token = crypto.randomUUID()

        // Store reset token
        await db.passwordReset.create({
            data: {
                id: crypto.randomUUID(),
                email,
                token,
                expires: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
            },
        })

        // Send reset email
        await sendPasswordResetEmail(email, token)

        return NextResponse.json(
            { message: "Password reset email sent" },
            { status: 200 }
        )
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: error.errors[0].message },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        )
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const token = searchParams.get("token")

        if (!token) {
            return NextResponse.json(
                { message: "Token is required" },
                { status: 400 }
            )
        }

        // Find reset token
        const resetToken = await db.passwordReset.findUnique({
            where: { token },
        })

        if (!resetToken) {
            return NextResponse.json(
                { message: "Invalid token" },
                { status: 400 }
            )
        }

        // Check if token is expired
        if (resetToken.expires < new Date()) {
            await db.passwordReset.delete({
                where: { token },
            })
            return NextResponse.json(
                { message: "Token has expired" },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { message: "Token is valid" },
            { status: 200 }
        )
    } catch (error) {
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        )
    }
}

export async function PUT(req: Request) {
    try {
        const { token, password } = await req.json()

        const { payload } = await jwtVerify(
            token,
            new TextEncoder().encode(env.NEXTAUTH_SECRET)
        )

        const userId = payload.userId as string

        const hashedPassword = await hash(password, 10)

        await db.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        })

        return new NextResponse(
            JSON.stringify({ message: "Password reset successful" }),
            { status: 200 }
        )
    } catch (error) {
        console.error("Error resetting password:", error)
        return new NextResponse(
            JSON.stringify({ message: "Invalid or expired token" }),
            { status: 400 }
        )
    }
} 