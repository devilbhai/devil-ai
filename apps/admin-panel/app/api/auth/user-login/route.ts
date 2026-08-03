import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-devil-ai-key';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const { email, password, deviceId, force } = await req.json();
    
    if (!email || !password || !deviceId) {
      return NextResponse.json({ message: 'Email, password and deviceId required' }, { status: 400, headers: corsHeaders });
    }
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: { subscriptions: true }
    });
    
    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401, headers: corsHeaders });
    }

    // Block banned users from logging in on ANY device
    if (user.status === 'BANNED') {
      return NextResponse.json({ message: 'Your account has been banned by the developer. Contact support for more information.', banned: true }, { status: 403, headers: corsHeaders });
    }
    
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401, headers: corsHeaders });
    }
    
    if (user.activeDeviceId && user.activeDeviceId !== deviceId && !force) {
      return NextResponse.json({ 
        message: 'You have a license to use Devil-AI in one PC at a time. If you want to use this account here, the other PC will be logged out.',
        requireForce: true
      }, { status: 409, headers: corsHeaders });
    }
    
    if (user.activeDeviceId !== deviceId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { activeDeviceId: deviceId }
      });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, deviceId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    const { passwordHash, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}
