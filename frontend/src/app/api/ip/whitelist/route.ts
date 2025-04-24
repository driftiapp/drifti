import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { ip } = await req.json();
    if (!ip) {
      return new NextResponse('IP address is required', { status: 400 });
    }

    // Validate IP address format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      return new NextResponse('Invalid IP address format', { status: 400 });
    }

    // Check if IP is already whitelisted
    const existingWhitelist = await db.whitelistedIP.findUnique({
      where: { ip },
    });

    if (existingWhitelist) {
      return new NextResponse('IP is already whitelisted', { status: 400 });
    }

    // Whitelist the IP
    const whitelistedIP = await db.whitelistedIP.create({
      data: {
        ip,
        whitelistedBy: session.user.id,
        reason: 'Whitelisted from map interface',
      },
    });

    return NextResponse.json(whitelistedIP);
  } catch (error) {
    console.error('Error whitelisting IP:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 