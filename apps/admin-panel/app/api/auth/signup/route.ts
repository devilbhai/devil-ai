import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-devil-ai-key';

export async function POST(req: Request) {
  try {
    const { name, email, password, deviceId } = await req.json();
    
    if (!email || !password || !deviceId) {
      return NextResponse.json({ message: 'Email, password, and deviceId are required' }, { status: 400 });
    }
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 400 });
    }
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        passwordHash,
        activeDeviceId: deviceId,
      }
    });
    
    // 1-Day Trial Logic
    const existingTrial = await prisma.deviceTrial.findUnique({
      where: {
        deviceId: deviceId
      }
    });

    let trialSubscription = null;
    if (!existingTrial) {
      trialSubscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          planId: 'TRIAL',
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });
      await prisma.deviceTrial.create({
        data: {
          deviceId: deviceId
        }
      });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    const { passwordHash: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      message: 'Signup successful',
      token,
      user: { ...userWithoutPassword, subscriptions: trialSubscription ? [trialSubscription] : [] }
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
