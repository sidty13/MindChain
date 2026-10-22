import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const moodLogs = await prisma.moodLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return NextResponse.json(moodLogs);
  } catch (error) {
    console.error('Error fetching mood logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, mood, rating } = body;

    if (!userId || !mood || rating === undefined) {
      return NextResponse.json({ error: 'User ID, mood, and rating required' }, { status: 400 });
    }

    const moodLog = await prisma.moodLog.create({
      data: {
        id: `${userId}_${Date.now()}`,
        userId,
        mood,
        rating,
        points: 10,
      },
    });

    return NextResponse.json(moodLog);
  } catch (error) {
    console.error('Error creating mood log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
