/**
 * QPay V2 — QR гаргах (Khan Bank, Golomt, TDB гэх мэт бүх апп-аар уншина)
 * @see https://github.com/qpay-sdk/qpay-js
 */

type QPayToken = { access_token: string; expires_in: number };
let cachedToken: { token: string; expiresAt: number } | null = null;

export type QPayConfig = {
  baseUrl: string;
  username: string;
  password: string;
  invoiceCode: string;
  callbackUrl: string;
};

export type QPayInvoiceResult = {
  invoiceId: string;
  qrImage: string | null;
  qrText: string | null;
  qPayShortUrl: string | null;
  urls: { name: string; description: string; link: string }[];
};

function cfg(): QPayConfig | null {
  const baseUrl = process.env.QPAY_BASE_URL?.trim();
  const username = process.env.QPAY_USERNAME?.trim();
  const password = process.env.QPAY_PASSWORD?.trim();
  const invoiceCode = process.env.QPAY_INVOICE_CODE?.trim();
  const callbackUrl = process.env.QPAY_CALLBACK_URL?.trim();
  if (!baseUrl || !username || !password || !invoiceCode || !callbackUrl) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ''), username, password, invoiceCode, callbackUrl };
}

export function isQPayConfigured(): boolean {
  return cfg() !== null;
}

async function qpayToken(): Promise<string> {
  const c = cfg();
  if (!c) throw new Error('QPay API тохируулаагүй (QPAY_*)');

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const basic = Buffer.from(`${c.username}:${c.password}`).toString('base64');
  const res = await fetch(`${c.baseUrl}/v2/auth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/json',
    },
  });
  const data = (await res.json()) as QPayToken & { error?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error ?? `QPay token алдаа (${res.status})`);
  }
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return data.access_token;
}

async function qpayFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const c = cfg();
  if (!c) throw new Error('QPay тохируулаагүй');
  const token = await qpayToken();
  const res = await fetch(`${c.baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (body as { message?: string }).message ??
      (body as { error?: string }).error ??
      `QPay ${res.status}`;
    throw new Error(msg);
  }
  return body as T;
}

export async function qpayCreateInvoice(input: {
  senderInvoiceNo: string;
  amount: number;
  description: string;
  callbackUrl?: string;
}): Promise<QPayInvoiceResult> {
  const c = cfg()!;

  const payload = {
    invoice_code: c.invoiceCode,
    sender_invoice_no: input.senderInvoiceNo,
    invoice_receiver_code: process.env.QPAY_RECEIVER_CODE?.trim() || 'terminal',
    invoice_description: input.description,
    amount: Math.round(input.amount),
    callback_url: input.callbackUrl ?? c.callbackUrl,
  };

  const data = await qpayFetch<{
    invoice_id?: string;
    qr_image?: string;
    qr_text?: string;
    qPay_shortUrl?: string;
    urls?: { name: string; description: string; link: string }[];
  }>('/v2/invoice', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const invoiceId = String(data.invoice_id ?? '');
  if (!invoiceId) throw new Error('QPay invoice_id ирээгүй');

  return {
    invoiceId,
    qrImage: data.qr_image ?? null,
    qrText: data.qr_text ?? null,
    qPayShortUrl: data.qPay_shortUrl ?? null,
    urls: data.urls ?? [],
  };
}

export async function qpayCheckInvoicePaid(invoiceId: string): Promise<boolean> {
  const data = await qpayFetch<{
    count?: number;
    paid_amount?: number;
    paidAmount?: number;
  }>('/v2/payment/check', {
    method: 'POST',
    body: JSON.stringify({
      object_type: 'INVOICE',
      object_id: invoiceId,
      offset: { page_number: 1, page_limit: 10 },
    }),
  });
  const paid = data.paid_amount ?? data.paidAmount ?? 0;
  return (data.count ?? 0) > 0 || paid > 0;
}
