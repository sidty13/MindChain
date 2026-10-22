import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const meditations = await prisma.meditation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return NextResponse.json(meditations);
  } catch (error) {
    console.error('Error fetching meditations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, duration, completed } = body;

    if (!userId || !duration) {
      return NextResponse.json({ error: 'User ID and duration required' }, { status: 400 });
    }

    const meditation = await prisma.meditation.create({
      data: {
        userId,
        duration,
        completed: completed ?? true,
        points: 30,
      },
    });

    return NextResponse.json(meditation);
  } catch (error) {
    console.error('Error creating meditation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, completed } = body;

    if (!id) {
      return NextResponse.json({ error: 'Meditation ID required' }, { status: 400 });
    }

    const meditation = await prisma.meditation.update({
      where: { id },
      data: { completed },
    });

    return NextResponse.json(meditation);
  } catch (error) {
    console.error('Error updating meditation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
