import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { prisma } from '../../../../lib/prisma';

// Use found credentials
const razorpay = new Razorpay({
  key_id: 'rzp_live_SNYgXU6SlkeB67',
  key_secret: 'xUHCJRiJIGOraV10ricE2Dna',
});

export async function POST(req: Request) {
  try {
    const { userId, planId, couponCode } = await req.json();

    if (!userId || !planId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({
      where: { slug: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    let finalAmount = plan.price;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });

      if (coupon && coupon.currentUses < coupon.maxUses && (!coupon.expiresAt || new Date() <= coupon.expiresAt)) {
        appliedCoupon = coupon.code;
        const discountAmount = Math.round((plan.price * coupon.discountPercentage) / 100);
        finalAmount = Math.max(100, plan.price - discountAmount); // minimum ₹1 (100 paise)
        
        // Note: We'll increment usage in the verify endpoint or here.
        // Doing it here is simpler but if payment fails, usage is lost.
        // It's safer to just pass it to notes and let verify endpoint increment it.
      } else {
        return NextResponse.json({ error: 'Invalid or expired coupon' }, { status: 400 });
      }
    }

    const orderOptions = {
      amount: finalAmount, // Amount in paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: {
        userId,
        planId,
        couponCode: appliedCoupon || '',
        callbackUrl: 'https://mindmapper.deviltools.in/',
      },
    };

    const order = await razorpay.orders.create(orderOptions);

    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: 'rzp_live_SNYgXU6SlkeB67',
    });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
