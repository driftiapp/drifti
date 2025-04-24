import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const updatedInvitation = await prisma.invitation.update({
      where: { id: params.id },
      data: {
        status: "REVOKED",
      },
    });

    return NextResponse.json(updatedInvitation);
  } catch (error) {
    console.error("[REVOKE_INVITATION_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 