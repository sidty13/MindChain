import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const achievements = await prisma.nFTAchievement.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(achievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, days, improvementRating } = body;

    if (!userId || !type || !days || improvementRating === undefined) {
      return NextResponse.json({ error: 'User ID, type, days, and improvement rating required' }, { status: 400 });
    }

    const achievement = await prisma.nFTAchievement.create({
      data: {
        id: `${userId}_${type}_${days}_${Date.now()}`,
        userId,
        type,
        days,
        improvementRating,
      },
    });

    return NextResponse.json(achievement);
  } catch (error) {
    console.error('Error creating achievement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, tokenId, contractAddress, transactionHash, minted } = body;

    if (!id) {
      return NextResponse.json({ error: 'Achievement ID required' }, { status: 400 });
    }

    const achievement = await prisma.nFTAchievement.update({
      where: { id },
      data: {
        ...(tokenId && { tokenId }),
        ...(contractAddress && { contractAddress }),
        ...(transactionHash && { transactionHash }),
        ...(minted !== undefined && { minted, mintedAt: minted ? new Date() : null }),
      },
    });

    return NextResponse.json(achievement);
  } catch (error) {
    console.error('Error updating achievement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
