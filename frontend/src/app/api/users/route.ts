import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const walletAddress = searchParams.get('walletAddress');

    if (!userId && !walletAddress) {
      return NextResponse.json({ error: 'User ID or wallet address required' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: userId ? { id: userId } : { walletAddress: walletAddress! },
      include: {
        journals: { orderBy: { createdAt: 'desc' }, take: 10 },
        meditations: { orderBy: { createdAt: 'desc' }, take: 10 },
        MoodLog: { orderBy: { createdAt: 'desc' }, take: 10 },
        NFTAchievement: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, farcasterFid, username, profileImage } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: {
        ...(farcasterFid && { farcasterFid }),
        ...(username && { username }),
        ...(profileImage && { profileImage }),
        updatedAt: new Date(),
      },
      create: {
        walletAddress,
        farcasterFid,
        username,
        profileImage,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, username, profileImage, points, journalStreak, meditationStreak } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const updateData: any = { updatedAt: new Date() };
    if (username !== undefined) updateData.username = username;
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    if (points !== undefined) updateData.points = points;
    if (journalStreak !== undefined) updateData.journalStreak = journalStreak;
    if (meditationStreak !== undefined) updateData.meditationStreak = meditationStreak;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
