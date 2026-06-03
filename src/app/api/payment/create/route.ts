import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { connectDB } from '@/lib/mongodb';
import { Payment } from '@/models/Payment';
import {
  PREMIUM_PRICES,
  parsePremiumPlanType,
  premiumPaymentType,
} from '@/lib/premium-pricing';
import { createCheckout, isPaymentConfigured } from '@/lib/payment';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.id === 'admin-hardcoded') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isPaymentConfigured()) {
      return NextResponse.json(
        {
          error:
            'Төлбөрийн систем тохируулаагүй. QPAY_* эсвэл KHANBANK_* env нэмнэ үү (.env.example харна уу).',
          configured: false,
        },
        { status: 503 },
      );
    }

    const body = await req.json();
    const plan = parsePremiumPlanType(String(body.type ?? ''));
    if (!plan) {
      return NextResponse.json({ error: 'Багц сонгоно уу' }, { status: 400 });
    }

    const pricing = PREMIUM_PRICES[plan];
    await connectDB();

    const payment = await Payment.create({
      userId: session.user.id,
      amount: pricing.amount,
      type: premiumPaymentType(plan),
      status: 'pending',
      method: 'qpay',
      note: `${pricing.labelMn} Premium (${pricing.months} сар)`,
    });

    const paymentId = payment._id.toString();

    try {
      const checkout = await createCheckout({
        paymentId,
        plan,
        amount: pricing.amount,
        description: `CyberPhysics Premium — ${pricing.labelMn}`,
      });

      payment.method = checkout.provider;
      payment.invoiceId = checkout.externalId;
      if (checkout.formUrl) payment.qrData = checkout.formUrl;
      await payment.save();

      return NextResponse.json({
        ok: true,
        plan,
        paymentId,
        provider: checkout.provider,
        amount: pricing.amount,
        months: pricing.months,
        invoice: checkout.externalId,
        qrImage: checkout.qrImage,
        qrText: checkout.qrText,
        shortUrl: checkout.shortUrl,
        formUrl: checkout.formUrl,
        bankUrls: checkout.bankUrls,
      });
    } catch (providerErr: unknown) {
      payment.status = 'failed';
      await payment.save();
      const msg = providerErr instanceof Error ? providerErr.message : 'Төлбөр үүсгэх алдаа';
      return NextResponse.json({ error: msg, paymentId }, { status: 502 });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
