import { NextResponse } from "next/server"
import { hash } from "bcrypt"
import { db } from "@/lib/db"
import { z } from "zod"
import { sendVerificationEmail } from "@/lib/email"

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, email, password } = registerSchema.parse(body)

        // Check if user already exists
        const existingUser = await db.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json(
                { message: "User already exists" },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await hash(password, 12)

        // Create user
        const user = await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        })

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
        await sendVerificationEmail({
            email,
            token,
            name,
        })

        return NextResponse.json(
            {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            },
            { status: 201 }
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