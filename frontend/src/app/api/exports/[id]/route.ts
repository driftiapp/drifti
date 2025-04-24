import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const share = await prisma.exportShare.findUnique({
      where: { id: params.id },
    });

    if (!share) {
      return new NextResponse('Not Found', { status: 404 });
    }

    if (new Date() > share.expiresAt) {
      return new NextResponse('Link Expired', { status: 410 });
    }

    // Redirect to the download URL
    return NextResponse.redirect(share.downloadUrl);
  } catch (error) {
    console.error('Error retrieving share:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 