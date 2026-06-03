'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CoinIcon } from './CoinIcon';
import { PremiumUpsellModal } from './PremiumUpsellModal';

export type CoinSpendModalProps = {
  open: boolean;
  onClose: () => void;
  coinCost: number;
  balance: number;
  title?: string;
  lines?: string[];
  proLine?: string;
  onConfirm: () => void | Promise<void>;
  confirmLoading?: boolean;
  showGetCoins?: boolean;
  showPro?: boolean;
  getCoinsHref?: string;
  proHref?: string;
};

export function CoinSpendModal({
  open,
  onClose,
  coinCost,
  balance,
  title,
  lines = [],
  proLine = 'PRO авбал бүх бодолтыг хязгааргүй харах боломжтой.',
  onConfirm,
  confirmLoading = false,
  showGetCoins = false,
  showPro = true,
  getCoinsHref = '/dashboard/premium',
  proHref = '/dashboard/premium',
}: CoinSpendModalProps) {
  const router = useRouter();
  const [upsellOpen, setUpsellOpen] = useState(false);
  const canAfford = balance >= coinCost;
  const remaining = Math.max(0, balance - coinCost);

  useEffect(() => {
    if (open && !canAfford && coinCost > 0) setUpsellOpen(true);
    if (!open) setUpsellOpen(false);
  }, [open, canAfford, coinCost]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  if (!canAfford && coinCost > 0) {
    return (
      <PremiumUpsellModal
        open={upsellOpen}
        onClose={() => {
          setUpsellOpen(false);
          onClose();
        }}
        reason="coins"
        coinCost={coinCost}
        balance={balance}
        title={title}
        premiumHref={proHref}
      />
    );
  }

  const heading = title ?? `${coinCost} зоос ашиглах уу?`;

  return (
    <div
      className="cy-coin-modal-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="cy-coin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cy-coin-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="cy-coin-modal-close"
          onClick={onClose}
          aria-label="Хаах"
        >
          ×
        </button>

        <div className="cy-coin-modal-head">
          <CoinIcon size="lg" glow animate />
          <h2 id="cy-coin-modal-title" className="cy-coin-modal-title">
            {heading}
          </h2>
        </div>

        <div className="cy-coin-modal-body">
          {lines.map((line, i) => (
            <p key={i} className="cy-coin-modal-line">
              {line}
            </p>
          ))}
          {lines.length === 0 && (
            <p className="cy-coin-modal-line">
              Энэ үйлдлийг хийхийн тулд {coinCost} зоос зарцуулна.
            </p>
          )}
          {showPro && proLine && (
            <p className="cy-coin-modal-line cy-coin-modal-line--muted">
              {proLine}{' '}
              <button
                type="button"
                className="cy-coin-inline-premium"
                onClick={() => router.push(proHref)}
              >
                Premium →
              </button>
            </p>
          )}
        </div>

        <div className="cy-coin-modal-balance">
          <CoinIcon size="sm" />
          <span>
            Үлдэгдэл:{' '}
            <strong className={canAfford ? 'cy-balance-ok' : 'cy-balance-low'}>
              {balance} зоос
            </strong>
            {canAfford && coinCost > 0 && (
              <span className="cy-balance-after">
                {' '}
                → {remaining} үлдэнэ
              </span>
            )}
          </span>
        </div>

        <div className="cy-coin-modal-actions">
          <button type="button" className="cy-coin-btn cy-coin-btn--ghost" onClick={onClose}>
            Болих
          </button>
          {showGetCoins && (
            <button
              type="button"
              className="cy-coin-btn cy-coin-btn--coins"
              onClick={() => router.push(getCoinsHref)}
            >
              <CoinIcon size="sm" />
              Зоос нэмж авах
            </button>
          )}
          {showPro && (
            <button
              type="button"
              className="cy-coin-btn cy-coin-btn--pro"
              onClick={() => router.push(proHref)}
            >
              PRO БОЛОХ
            </button>
          )}
          <button
            type="button"
            className="cy-coin-btn cy-coin-btn--spend"
            disabled={!canAfford || confirmLoading}
            onClick={() => void onConfirm()}
          >
            <CoinIcon size="sm" />
            {confirmLoading ? '...' : `${coinCost} зоос зарцуулах`}
          </button>
        </div>
      </div>
    </div>
  );
}
