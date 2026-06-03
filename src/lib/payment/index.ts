import type { PremiumPlanType } from '@/lib/premium-pricing';
import { isKhanBankConfigured, khanCheckOrder, khanRegisterOrder } from './khanbank';
import { isQPayConfigured, qpayCheckInvoicePaid, qpayCreateInvoice } from './qpay';

export type PaymentProvider = 'qpay' | 'khan_bank';

export type CheckoutSession = {
  provider: PaymentProvider;
  externalId: string;
  qrImage: string | null;
  qrText: string | null;
  shortUrl: string | null;
  formUrl: string | null;
  bankUrls: { name: string; description: string; link: string }[];
};

export function getPaymentProvider(): PaymentProvider {
  const forced = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();
  if (forced === 'khan_bank' || forced === 'khanbank') return 'khan_bank';
  if (forced === 'qpay') return 'qpay';
  if (isQPayConfigured()) return 'qpay';
  if (isKhanBankConfigured()) return 'khan_bank';
  return 'qpay';
}

export function isPaymentConfigured(): boolean {
  return isQPayConfigured() || isKhanBankConfigured();
}

function appBaseUrl(): string {
  return (
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

export async function createCheckout(input: {
  paymentId: string;
  plan: PremiumPlanType;
  amount: number;
  description: string;
}): Promise<CheckoutSession> {
  const provider = getPaymentProvider();
  const base = appBaseUrl();
  const orderNo = `CP-${input.paymentId}`;

  if (provider === 'qpay') {
    const invoice = await qpayCreateInvoice({
      senderInvoiceNo: orderNo,
      amount: input.amount,
      description: input.description,
      callbackUrl: `${base}/api/payment/callback/qpay`,
    });
    return {
      provider: 'qpay',
      externalId: invoice.invoiceId,
      qrImage: invoice.qrImage,
      qrText: invoice.qrText,
      shortUrl: invoice.qPayShortUrl,
      formUrl: invoice.qPayShortUrl,
      bankUrls: invoice.urls,
    };
  }

  const { orderId, formUrl } = await khanRegisterOrder({
    orderNumber: orderNo,
    amount: input.amount,
    description: input.description,
    returnUrl: `${base}/api/payment/callback/khanbank?paymentId=${input.paymentId}`,
    failUrl: `${base}/dashboard/premium?payment=failed`,
  });

  return {
    provider: 'khan_bank',
    externalId: orderId,
    qrImage: null,
    qrText: null,
    shortUrl: null,
    formUrl,
    bankUrls: [],
  };
}

export async function verifyExternalPayment(
  provider: PaymentProvider,
  externalId: string,
): Promise<boolean> {
  if (provider === 'qpay') return qpayCheckInvoicePaid(externalId);
  const status = await khanCheckOrder(externalId);
  return status.success;
}

export { isQPayConfigured, isKhanBankConfigured };
