import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendVerificationEmail } from "@/lib/email"
import { z } from "zod"

const verifySchema = z.object({
    email: z.string().email("Invalid email address"),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { email } = verifySchema.parse(body)

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

        // Generate verification token
        const token = crypto.randomUUID()

        // Store verification token
        await db.verificationToken.create({
            data: {
                identifier: email,
                token,
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                type: "email",
            },
        })

        // Send verification email
        await sendVerificationEmail(email, token)

        return NextResponse.json(
            { message: "Verification email sent" },
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

        // Find verification token
        const verificationToken = await db.verificationToken.findUnique({
            where: { token },
        })

        if (!verificationToken) {
            return NextResponse.json(
                { message: "Invalid token" },
                { status: 400 }
            )
        }

        // Check if token is expired
        if (verificationToken.expires < new Date()) {
            await db.verificationToken.delete({
                where: { token },
            })
            return NextResponse.json(
                { message: "Token has expired" },
                { status: 400 }
            )
        }

        // Update user's email verification status
        await db.user.update({
            where: { email: verificationToken.identifier },
            data: { emailVerified: new Date() },
        })

        // Delete used token
        await db.verificationToken.delete({
            where: { token },
        })

        return NextResponse.json(
            { message: "Email verified successfully" },
            { status: 200 }
        )
    } catch (error) {
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        )
    }
} 