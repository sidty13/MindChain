import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const journals = await prisma.journal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(journals);
  } catch (error) {
    console.error('Error fetching journals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, content } = body;

    if (!userId || !content) {
      return NextResponse.json({ error: 'User ID and content required' }, { status: 400 });
    }

    const journal = await prisma.journal.create({
      data: {
        userId,
        content,
      },
    });

    return NextResponse.json(journal);
  } catch (error) {
    console.error('Error creating journal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
