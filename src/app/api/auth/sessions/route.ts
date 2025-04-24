import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
    try {
        const session = await auth()

        if (!session) {
            return new NextResponse(
                JSON.stringify({ message: "Unauthorized" }),
                { status: 401 }
            )
        }

        const activeSessions = await db.session.findMany({
            where: {
                userId: session.user.id,
            },
            select: {
                id: true,
                sessionToken: true,
                expires: true,
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        })

        return new NextResponse(JSON.stringify(activeSessions), { status: 200 })
    } catch (error) {
        console.error("Error fetching sessions:", error)
        return new NextResponse(
            JSON.stringify({ message: "Internal server error" }),
            { status: 500 }
        )
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await auth()

        if (!session) {
            return new NextResponse(
                JSON.stringify({ message: "Unauthorized" }),
                { status: 401 }
            )
        }

        const { sessionId } = await req.json()

        await db.session.delete({
            where: {
                id: sessionId,
                userId: session.user.id,
            },
        })

        return new NextResponse(
            JSON.stringify({ message: "Session deleted" }),
            { status: 200 }
        )
    } catch (error) {
        console.error("Error deleting session:", error)
        return new NextResponse(
            JSON.stringify({ message: "Internal server error" }),
            { status: 500 }
        )
    }
} 