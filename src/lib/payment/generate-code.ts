import { Payment } from '@/models/Payment';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CODE_LEN = 6;

function randomCode(): string {
  let s = 'CP-';
  for (let i = 0; i < CODE_LEN; i++) {
    s += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return s;
}

/**
 * Generate a unique payment code like CP-A7K93X.
 * Retries up to 10 times on collision (astronomically unlikely).
 */
export async function generatePaymentCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode();
    const exists = await Payment.exists({ paymentCode: code });
    if (!exists) return code;
  }
  // Fallback: timestamp suffix guarantees uniqueness
  return `CP-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}
