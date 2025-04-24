import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendInvitationEmail } from "@/lib/email";
import { z } from "zod";
import { randomBytes } from "crypto";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "USER"]),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const body = inviteSchema.parse(json);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return new NextResponse("User already exists", { status: 400 });
    }

    // Check for existing invitation
    const existingInvitation = await prisma.invitation.findUnique({
      where: { email: body.email },
    });

    if (existingInvitation) {
      return new NextResponse("Invitation already sent", { status: 400 });
    }

    // Generate secure token
    const token = randomBytes(32).toString("hex");
    
    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        email: body.email,
        role: body.role,
        token,
        expiresAt,
        invitedBy: session.user.id,
      },
    });

    // Send invitation email
    await sendInvitationEmail({
      to: body.email,
      token: invitation.token,
    });

    return NextResponse.json(invitation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }

    console.error("[INVITATION_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 