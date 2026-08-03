import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const onlineUsers = await prisma.user.count({
      where: {
        status: 'ACTIVE',
        lastActiveAt: { gte: fiveMinAgo },
      },
    });

    return NextResponse.json({ onlineUsers });
  } catch (error) {
    console.error('Online users error:', error);
    return NextResponse.json({ onlineUsers: 0 });
  }
}
