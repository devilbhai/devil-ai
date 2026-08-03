import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '../../../../lib/prisma';

const RAZORPAY_KEY_SECRET = 'xUHCJRiJIGOraV10ricE2Dna';

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, planId, amount, couponCode } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !planId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Verify signature
    const text = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Record the payment
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: amount,
        currency: 'INR',
        status: 'COMPLETED',
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
      },
    });

    // Create or extend subscription
    const plan = await prisma.plan.findUnique({
      where: { slug: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    if (couponCode) {
      try {
        await prisma.coupon.update({
          where: { code: couponCode.toUpperCase() },
          data: {
            currentUses: { increment: 1 }
          }
        });
      } catch (e) {
        console.error("Failed to update coupon usage:", e);
      }
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    // Cancel existing active subscriptions for this user
    await prisma.subscription.updateMany({
      where: {
        userId: userId,
        status: 'ACTIVE',
      },
      data: {
        status: 'CANCELLED',
      },
    });

    // Create new subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      subscriptionId: subscription.id,
    });
  } catch (error: any) {
    console.error('Error verifying Razorpay payment:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
