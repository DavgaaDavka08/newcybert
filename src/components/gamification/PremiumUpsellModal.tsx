'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { COIN_COSTS } from '@/lib/gamification';
import { formatMnt, PREMIUM_PRICES } from '@/lib/premium-pricing';

export type PremiumUpsellReason = 'coins' | 'lives';

export type PremiumUpsellModalProps = {
  open: boolean;
  onClose: () => void;
  reason: PremiumUpsellReason;
  /** Шаардлагатай зоос (зоос дууссан үед) */
  coinCost?: number;
  balance?: number;
  /** Амь нөхөх зоос — lives reason */
  refillCoinCost?: number;
  title?: string;
  premiumHref?: string;
  /** Амь сэргэх хүртэлх timestamp (lives) */
  nextRefillAt?: number | null;
};

const PREMIUM_PERKS = [
  'Амь хязгааргүй (∞)',
  'Бүх видео · шалгалт · AI үнэгүй',
  'Зоос зарцуулахгүй',
];

export function PremiumUpsellModal({
  open,
  onClose,
  reason,
  coinCost = 0,
  balance = 0,
  refillCoinCost = COIN_COSTS.full_heal,
  title,
  premiumHref = '/dashboard/premium',
  nextRefillAt = null,
}: PremiumUpsellModalProps) {
  const router = useRouter();
  const fromPrice = formatMnt(PREMIUM_PRICES.monthly.amount);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || reason !== 'lives' || !nextRefillAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [open, reason, nextRefillAt]);

  if (!open) return null;

  const rem = nextRefillAt ? Math.max(0, nextRefillAt - now) : 0;
  const mins = Math.floor(rem / 60000);
  const secs = Math.floor((rem % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');

  const heading =
    title ??
    (reason === 'lives'
      ? 'Амь дууслаа!'
      : 'Зоос хүрэлцэхгүй байна');

  const subtitle =
    reason === 'lives'
      ? `Premium авбал амь алдахгүй, хязгааргүй давталт хийнэ. Эсвэл ${refillCoinCost} зоосоор нөхнө.`
      : `Энэ үйлдэлд ${coinCost} зоос хэрэгтэй. Танд ${balance} зоос үлдсэн. Premium авбал зоос зарцуулахгүй.`;

  return (
    <div className="cy-premium-upsell-overlay" role="presentation" onClick={onClose}>
      <div
        className="cy-premium-upsell"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cy-premium-upsell-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="cy-premium-upsell-close" onClick={onClose} aria-label="Хаах">
          ×
        </button>

        <div className="cy-premium-upsell-badge">⭐ Premium</div>
        <h2 id="cy-premium-upsell-title" className="cy-premium-upsell-title">
          {heading}
        </h2>
        <p className="cy-premium-upsell-sub">{subtitle}</p>

        {reason === 'lives' && rem > 0 && (
          <div className="cy-premium-upsell-timer" aria-live="polite">
            <span className="cy-premium-upsell-timer-label">Үнэгүй +1 амь</span>
            <span className="cy-premium-upsell-timer-val">
              {pad(mins)}:{pad(secs)}
            </span>
          </div>
        )}

        <ul className="cy-premium-upsell-perks">
          {PREMIUM_PERKS.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>

        <p className="cy-premium-upsell-price">
          <span className="cy-premium-upsell-price-from">{fromPrice}</span>
          <span className="cy-premium-upsell-price-label">/сараас эхлэнэ</span>
        </p>

        <div className="cy-premium-upsell-actions">
          <button
            type="button"
            className="cy-premium-upsell-btn cy-premium-upsell-btn--primary"
            onClick={() => router.push(premiumHref)}
          >
            Premium авах →
          </button>
          <button type="button" className="cy-premium-upsell-btn cy-premium-upsell-btn--ghost" onClick={onClose}>
            Дараа
          </button>
        </div>
      </div>
    </div>
  );
}
