import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { initializeApp, getApps } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Initialize Firebase if not already initialized
if (!getApps().length) {
  initializeApp({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
  });
}

const shareSchema = z.object({
  filename: z.string(),
  content: z.string(),
  expiresIn: z.number().min(3600).max(604800).default(86400), // 1 hour to 7 days, default 24 hours
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { filename, content, expiresIn } = shareSchema.parse(body);

    // Upload to Firebase Storage
    const storage = getStorage();
    const storageRef = ref(storage, `exports/${session.user.id}/${filename}`);
    const blob = new Blob([content], { type: 'application/zip' });
    
    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);

    // Create share record in database
    const share = await prisma.exportShare.create({
      data: {
        userId: session.user.id,
        filename,
        downloadUrl,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      },
    });

    return NextResponse.json({
      shareUrl: `/api/exports/${share.id}`,
      expiresAt: share.expiresAt,
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 