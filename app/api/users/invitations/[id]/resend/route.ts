import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendInvitationEmail } from "@/lib/email";
import { generateToken } from "@/lib/tokens";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { id: params.id },
    });

    if (!invitation) {
      return new NextResponse("Invitation not found", { status: 404 });
    }

    if (invitation.status !== "PENDING") {
      return new NextResponse("Invitation is not pending", { status: 400 });
    }

    // Generate a new token and update expiration
    const newToken = generateToken();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7); // 7 days from now

    const updatedInvitation = await prisma.invitation.update({
      where: { id: params.id },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
      },
    });

    // Send the new invitation email
    await sendInvitationEmail({
      email: invitation.email,
      token: newToken,
      role: invitation.role,
    });

    return NextResponse.json(updatedInvitation);
  } catch (error) {
    console.error("[RESEND_INVITATION_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 