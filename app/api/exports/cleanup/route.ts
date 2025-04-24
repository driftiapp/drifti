import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { initializeAppIfNecessary } from '@/lib/firebase';

// Initialize Firebase if not already initialized
initializeAppIfNecessary();

export async function POST() {
  try {
    // Find all expired shares
    const expiredShares = await prisma.exportShare.findMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
      select: {
        id: true,
        filePath: true,
      },
    });

    if (expiredShares.length === 0) {
      return NextResponse.json({ deletedCount: 0 });
    }

    const storage = getStorage();
    const errors: string[] = [];
    let deletedCount = 0;

    // Delete files from storage and database records
    for (const share of expiredShares) {
      try {
        // Skip if filePath is null or invalid
        if (!share.filePath || share.filePath.includes('..')) {
          errors.push(`Invalid file path for share ${share.id}`);
          continue;
        }

        // Delete from Firebase Storage
        const fileRef = ref(storage, share.filePath);
        await deleteObject(fileRef);
        deletedCount++;
      } catch (error) {
        errors.push(`Failed to delete file for share ${share.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Delete database records for all expired shares
    await prisma.exportShare.deleteMany({
      where: {
        id: {
          in: expiredShares.map(share => share.id),
        },
      },
    });

    return NextResponse.json({
      deletedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[Cleanup Error]', error);
    return NextResponse.json(
      { error: 'Failed to cleanup expired shares' },
      { status: 500 }
    );
  }
} 