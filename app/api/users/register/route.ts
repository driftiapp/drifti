import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcrypt";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  token: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, token } = registerSchema.parse(body);

    // Verify invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      select: { email: true, role: true, expiresAt: true },
    });

    if (!invitation) {
      return new NextResponse("Invalid token", { status: 400 });
    }

    if (invitation.expiresAt < new Date()) {
      return new NextResponse("Token expired", { status: 400 });
    }

    if (invitation.email !== email) {
      return new NextResponse("Email mismatch", { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse("User already exists", { status: 400 });
    }

    // Create user
    const hashedPassword = await hash(password, 10);
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: invitation.role,
      },
    });

    // Delete invitation
    await prisma.invitation.delete({
      where: { token },
    });

    return new NextResponse("User created successfully", { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 });
    }

    console.error("Error registering user:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
} 