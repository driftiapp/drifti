import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/storage';

export async function GET(
  request: Request,
  { params }: { params: { ip: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notes = await prisma.iPNote.findMany({
      where: {
        ipAddress: params.ip,
      },
      include: {
        attachments: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching IP notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { ip: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const content = formData.get('content') as string;
    const category = formData.get('category') as string || 'general';
    const files = formData.getAll('attachments') as File[];

    if (!content) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      );
    }

    const note = await prisma.iPNote.create({
      data: {
        content,
        category,
        ipAddress: params.ip,
        userId: session.user.id,
      },
    });

    if (files.length > 0) {
      const attachments = await Promise.all(
        files.map(async (file) => {
          const { url, path } = await uploadFile(
            file,
            `ip-notes/${params.ip}/${note.id}/${file.name}`
          );

          return prisma.iPNoteAttachment.create({
            data: {
              noteId: note.id,
              filename: file.name,
              fileType: file.type,
              fileSize: file.size,
              url,
            },
          });
        })
      );

      return NextResponse.json({ ...note, attachments });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error creating IP note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
} 