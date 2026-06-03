'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { formatMnt } from '@/lib/premium-pricing';

export type PaymentCheckoutData = {
  paymentId: string;
  provider: 'qpay' | 'khan_bank';
  amount: number;
  qrImage: string | null;
  qrText: string | null;
  formUrl: string | null;
  shortUrl: string | null;
  bankUrls: { name: string; description: string; link: string }[];
};

type PremiumPaymentModalProps = {
  open: boolean;
  onClose: () => void;
  checkout: PaymentCheckoutData | null;
  onSuccess?: () => void;
};

export function PremiumPaymentModal({
  open,
  onClose,
  checkout,
  onSuccess,
}: PremiumPaymentModalProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'waiting' | 'success' | 'error'>('waiting');
  const [pollError, setPollError] = useState('');

  const poll = useCallback(async () => {
    if (!checkout?.paymentId) return;
    try {
      const res = await fetch(`/api/payment/status?paymentId=${checkout.paymentId}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.status === 'success') {
        setStatus('success');
        onSuccess?.();
        router.refresh();
      }
    } catch {
      setPollError('Статус шалгахад алдаа');
    }
  }, [checkout?.paymentId, onSuccess, router]);

  useEffect(() => {
    if (!open || !checkout) return;
    setStatus('waiting');
    setPollError('');
    const id = setInterval(() => void poll(), 3000);
    return () => clearInterval(id);
  }, [open, checkout, poll]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !checkout) return null;

  const qrSrc = checkout.qrImage
    ? checkout.qrImage.startsWith('data:')
      ? checkout.qrImage
      : `data:image/png;base64,${checkout.qrImage}`
    : null;

  return (
    <div className="cy-pay-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="cy-pay-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="cy-pay-modal-close" onClick={onClose} aria-label="Хаах">
          ×
        </button>

        {status === 'success' ? (
          <div className="cy-pay-modal-success">
            <div className="cy-pay-modal-success-icon">✓</div>
            <h2>Premium идэвхжлээ!</h2>
            <p>Баярлалаа. Одоо бүх онцлог нээгдлээ.</p>
            <button type="button" className="cy-pay-modal-btn cy-pay-modal-btn--primary" onClick={onClose}>
              Хаах
            </button>
          </div>
        ) : (
          <>
            <h2 className="cy-pay-modal-title">Төлбөр төлөх</h2>
            <p className="cy-pay-modal-amount">{formatMnt(checkout.amount)}</p>

            {checkout.provider === 'qpay' && qrSrc && (
              <div className="cy-pay-modal-qr-wrap">
                <img src={qrSrc} alt="QPay QR" className="cy-pay-modal-qr" />
                <p className="cy-pay-modal-hint">
                  Khan Bank эсвэл бусад банкны аппаар QR уншуулна уу
                </p>
              </div>
            )}

            {checkout.provider === 'khan_bank' && checkout.formUrl && (
              <div className="cy-pay-modal-khan">
                <p className="cy-pay-modal-hint">
                  Khan Bank-ийн төлбөрийн хуудас нээгдэнэ. Тэнд QR код харагдана.
                </p>
                <a
                  href={checkout.formUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cy-pay-modal-btn cy-pay-modal-btn--primary"
                >
                  Khan Bank төлбөр нээх →
                </a>
              </div>
            )}

            {checkout.bankUrls.length > 0 && (
              <div className="cy-pay-modal-banks">
                <p className="cy-pay-modal-banks-label">Эсвэл аппаар нээх:</p>
                <div className="cy-pay-modal-banks-list">
                  {checkout.bankUrls.slice(0, 6).map((u) => (
                    <a
                      key={u.link}
                      href={u.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cy-pay-modal-bank-link"
                    >
                      {u.description || u.name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <p className="cy-pay-modal-wait">
              Төлбөр хийсний дараа автоматаар баталгаажина…
              {pollError && <span className="cy-pay-modal-wait-err"> ({pollError})</span>}
            </p>
            <button type="button" className="cy-pay-modal-btn cy-pay-modal-btn--ghost" onClick={() => void poll()}>
              Шалгах
            </button>
          </>
        )}
      </div>
    </div>
  );
}
