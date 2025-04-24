import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where = {
      ...(from && to
        ? {
            createdAt: {
              gte: new Date(from),
              lte: new Date(to),
            },
          }
        : {}),
    };

    const invitations = await prisma.invitation.findMany({
      where,
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
    console.error("[INVITATIONS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 