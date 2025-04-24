import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const invitations = await prisma.invitation.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        inviter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error("[INVITATIONS_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 