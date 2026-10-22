import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');

    if (!userId || !date) {
      return NextResponse.json({ error: 'User ID and date required' }, { status: 400 });
    }

    const activity = await prisma.dailyActivity.findUnique({
      where: {
        userId_date: {
          userId,
          date: new Date(date),
        },
      },
    });

    return NextResponse.json(activity || {
      meditationDone: false,
      journalDone: false,
      moodLogDone: false,
    });
  } catch (error) {
    console.error('Error fetching daily activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, date, meditationDone, journalDone, moodLogDone } = body;

    if (!userId || !date) {
      return NextResponse.json({ error: 'User ID and date required' }, { status: 400 });
    }

    const activity = await prisma.dailyActivity.upsert({
      where: {
        userId_date: {
          userId,
          date: new Date(date),
        },
      },
      update: {
        ...(meditationDone !== undefined && { meditationDone }),
        ...(journalDone !== undefined && { journalDone }),
        ...(moodLogDone !== undefined && { moodLogDone }),
      },
      create: {
        id: `${userId}_${date}`,
        userId,
        date: new Date(date),
        meditationDone: meditationDone ?? false,
        journalDone: journalDone ?? false,
        moodLogDone: moodLogDone ?? false,
      },
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error updating daily activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
