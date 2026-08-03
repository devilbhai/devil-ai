'use server'

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '../lib/prisma';
import { revalidatePath } from 'next/cache';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'gunjan@agribee.in';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'DevilBhai@1010';

export async function loginAdmin(formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    (await cookies()).set('admin_token', 'devil-auth-super-secret-token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return { success: true };
  }

  return { error: 'Invalid credentials' };
}

export async function logoutAdmin() {
  (await cookies()).delete('admin_token');
  redirect('/login');
}

export async function createCoupon(formData: FormData) {
  const code = formData.get('code') as string;
  const discountPercentage = parseInt(formData.get('discountPercentage') as string);
  const maxUses = parseInt(formData.get('maxUses') as string) || 100;

  if (!code || isNaN(discountPercentage)) return;

  await prisma.coupon.create({
    data: {
      code: code.toUpperCase(),
      discountPercentage,
      maxUses,
      currentUses: 0,
    }
  });

  revalidatePath('/coupons');
}

export async function banUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: 'User not found' };

  const newStatus = user.status === 'BANNED' ? 'ACTIVE' : 'BANNED';
  await prisma.user.update({
    where: { id: userId },
    data: {
      status: newStatus,
      activeDeviceId: newStatus === 'BANNED' ? null : undefined,
    },
  });

  if (newStatus === 'BANNED') {
    await prisma.subscription.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'CANCELLED' },
    });
  }

  revalidatePath('/users');
  return { success: true, status: newStatus };
}

export async function deleteUser(userId: string) {
  await prisma.subscription.deleteMany({ where: { userId } });
  await prisma.payment.deleteMany({ where: { userId } });
  await prisma.workspace.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath('/users');
  return { success: true };
}

export async function saveRazorpaySettings(formData: FormData) {
  const keyId = formData.get('keyId') as string;
  const keySecret = formData.get('keySecret') as string;
  // Store in env or database — for now just return success
  return { success: true };
}

export async function createSubscriptionForUser(formData: FormData) {
  const userId = formData.get('userId') as string;
  const planId = formData.get('planId') as string;
  const durationDays = parseInt(formData.get('durationDays') as string);

  if (!userId || !planId || isNaN(durationDays)) return { error: 'Invalid params' };

  const now = new Date();
  const periodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  await prisma.subscription.create({
    data: {
      userId,
      planId,
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });

  revalidatePath('/subscriptions');
  revalidatePath('/users');
  return { success: true };
}

export async function cancelSubscription(subId: string) {
  await prisma.subscription.update({
    where: { id: subId },
    data: { status: 'CANCELLED' },
  });
  revalidatePath('/subscriptions');
  return { success: true };
}
