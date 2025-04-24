import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { ip, reason, expiresAt } = body;

    if (!ip || !reason) {
      return new NextResponse('IP and reason are required', { status: 400 });
    }

    // Validate IP address format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      return new NextResponse('Invalid IP address format', { status: 400 });
    }

    // Check if IP is already blocked
    const existingBlock = await prisma.blockedIP.findUnique({
      where: { ip },
    });

    if (existingBlock) {
      return new NextResponse('IP is already blocked', { status: 400 });
    }

    const blockedIP = await prisma.blockedIP.create({
      data: {
        ip,
        reason,
        blockedBy: session.user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json(blockedIP);
  } catch (error) {
    console.error('Error blocking IP:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 