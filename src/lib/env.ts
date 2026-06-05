/**
 * Production env шалгалт — сервер талд ажиллана.
 * Дутуу хувьсагч байвал тодорхой алдаа буцаана.
 */

const REQUIRED_PROD = [
  'MONGODB_URI',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
] as const;

const REQUIRED_PAYMENT = [
  'BANK_ACCOUNT',
  'BANK_HOLDER',
] as const;

export function assertProductionEnv(scope: 'core' | 'payment' = 'core'): void {
  if (process.env.NODE_ENV !== 'production') return;

  const missing: string[] = [];

  for (const key of REQUIRED_PROD) {
    if (!process.env[key]?.trim()) missing.push(key);
  }

  if (scope === 'payment') {
    for (const key of REQUIRED_PAYMENT) {
      if (!process.env[key]?.trim()) missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Production env дутуу: ${missing.join(', ')}`);
  }

  const url = process.env.NEXTAUTH_URL ?? '';
  if (url.includes('localhost')) {
    throw new Error('NEXTAUTH_URL нь production дээр localhost байж болохгүй');
  }
}
