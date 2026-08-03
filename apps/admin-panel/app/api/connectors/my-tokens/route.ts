import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('user_email');

    if (!userEmail) {
      return NextResponse.json({ error: 'Missing user_email parameter' }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch all active connector tokens for this user
    const tokens = await prisma.connectorToken.findMany({
      where: { userId: user.id },
    });

    // Format the response as a dictionary keyed by provider
    const formattedTokens: Record<string, any> = {};

    for (const token of tokens) {
      formattedTokens[token.provider] = {
        apiToken: token.accessToken,
        refreshToken: token.refreshToken || null,
        expiry: token.expiresAt ? new Date(token.expiresAt).getTime() : null,
        connectedAt: new Date(token.createdAt).getTime(),
      };
    }

    return NextResponse.json(formattedTokens);
  } catch (error) {
    console.error('Error fetching connector tokens:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
