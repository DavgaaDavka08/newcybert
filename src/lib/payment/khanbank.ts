/**
 * Khan Bank E-Commerce REST (register.do / getOrderStatusExtended.do)
 * Merchant гэрээ: merchant@khanbank.com · KHAN MERCHANT app
 * @see https://pypi.org/project/mongolian-payment-khanbank/
 */

export type KhanBankConfig = {
  endpoint: string;
  username: string;
  password: string;
  language?: 'mn' | 'en';
};

export type KhanRegisterResult = {
  orderId: string;
  formUrl: string;
};

export type KhanOrderStatus = {
  success: boolean;
  orderStatus?: number;
  errorCode?: string;
  errorMessage?: string;
};

function cfg(): KhanBankConfig | null {
  const endpoint = process.env.KHANBANK_ENDPOINT?.trim();
  const username = process.env.KHANBANK_USERNAME?.trim();
  const password = process.env.KHANBANK_PASSWORD?.trim();
  if (!endpoint || !username || !password) return null;
  return {
    endpoint: endpoint.replace(/\/$/, ''),
    username,
    password,
    language: (process.env.KHANBANK_LANGUAGE as 'mn' | 'en') || 'mn',
  };
}

export function isKhanBankConfigured(): boolean {
  return cfg() !== null;
}

async function khanRequest(path: string, params: Record<string, string>): Promise<Record<string, unknown>> {
  const c = cfg();
  if (!c) throw new Error('Khan Bank API тохируулаагүй (KHANBANK_*)');

  const qs = new URLSearchParams({
    userName: c.username,
    password: c.password,
    language: c.language ?? 'mn',
    ...params,
  });

  const url = `${c.endpoint}/${path}?${qs.toString()}`;
  const res = await fetch(url, { method: 'GET', cache: 'no-store' });
  const text = await res.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`Khan Bank хариу буруу: ${text.slice(0, 200)}`);
  }
}

/** Шинэ захиалга — formUrl дээр QR / төлбөрийн хуудас */
export async function khanRegisterOrder(input: {
  orderNumber: string;
  amount: number;
  description: string;
  returnUrl: string;
  failUrl: string;
}): Promise<KhanRegisterResult> {
  const data = await khanRequest('register.do', {
    orderNumber: input.orderNumber,
    amount: String(Math.round(input.amount)),
    currency: '496',
    returnUrl: input.returnUrl,
    failUrl: input.failUrl,
    description: input.description.slice(0, 120),
  });

  const orderId = String(data.orderId ?? '');
  const formUrl = String(data.formUrl ?? '');
  if (!orderId || !formUrl) {
    const err = String(data.errorMessage ?? data.errorCode ?? 'register алдаа');
    throw new Error(`Khan Bank: ${err}`);
  }
  return { orderId, formUrl };
}

/** 2 = төлөгдсөн (ихэнх gateway-д) */
export async function khanCheckOrder(orderId: string): Promise<KhanOrderStatus> {
  const data = await khanRequest('getOrderStatusExtended.do', { orderId });

  const orderStatus = Number(data.orderStatus ?? data.OrderStatus ?? -1);
  const errorCode = data.errorCode != null ? String(data.errorCode) : undefined;
  const errorMessage = data.errorMessage != null ? String(data.errorMessage) : undefined;

  const success =
    orderStatus === 2 ||
    String(data.orderStatus).toUpperCase() === 'PAID' ||
    data.paymentState === 'DEPOSITED';

  return { success, orderStatus, errorCode, errorMessage };
}
