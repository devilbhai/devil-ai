import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (plans.length === 0) {
      const now = new Date();
      const defaults = [
        { slug: 'WEEKLY', name: 'Weekly', price: 4900, durationDays: 7, features: 'Unlimited AI chat,Unlimited workspaces,7-day access', sortOrder: 0 },
        { slug: 'MONTHLY', name: 'Monthly', price: 9900, durationDays: 30, features: 'Everything in Weekly,GitHub integration,30-day access', sortOrder: 1 },
        { slug: 'YEARLY', name: 'Yearly', price: 99900, durationDays: 365, features: 'Everything in Monthly,Priority support,Save ₹189/year', isBestValue: true, sortOrder: 2 },
        { slug: 'LIFETIME', name: 'Lifetime', price: 999900, durationDays: 36500, features: 'Everything in Yearly,Lifetime access,All future updates', sortOrder: 3 },
      ];

      for (const p of defaults) {
        await prisma.plan.create({ data: { ...p, isActive: true, isBestValue: p.isBestValue || false } });
      }

      const created = await prisma.plan.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
      return NextResponse.json({ plans: formatPlans(created) });
    }

    return NextResponse.json({ plans: formatPlans(plans) });
  } catch (error) {
    console.error('Plans fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function formatPlans(plans: any[]) {
  return plans.map(p => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    currency: p.currency,
    durationDays: p.durationDays,
    features: p.features.split(',').map((f: string) => f.trim()),
    isBestValue: p.isBestValue,
    priceDisplay: `₹${Math.floor(p.price / 100)}`,
  }));
}
