import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const verifyTokenSchema = z.object({
  token: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token } = verifyTokenSchema.parse(body);

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      select: { email: true, expiresAt: true },
    });

    if (!invitation) {
      return new NextResponse("Invalid token", { status: 400 });
    }

    if (invitation.expiresAt < new Date()) {
      return new NextResponse("Token expired", { status: 400 });
    }

    return NextResponse.json({ email: invitation.email });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 });
    }

    console.error("Error verifying token:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
} 