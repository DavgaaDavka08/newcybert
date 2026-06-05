'use client';

import Link from 'next/link';
import { formatMnt } from '@/lib/premium-pricing';
import type { PaymentNotification } from '@/hooks/usePaymentNotifications';

type Props = {
  notification: PaymentNotification;
  onDismiss: () => void;
  compact?: boolean;
};

export function PaymentAlertBanner({ notification, onDismiss, compact }: Props) {
  const isSuccess = notification.type === 'success';
  const isRejected = notification.type === 'rejected';

  return (
    <div
      className={`cy-payment-alert cy-payment-alert--${notification.type}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="cy-payment-alert-icon" aria-hidden>
        {isSuccess ? '✓' : isRejected ? '!' : 'i'}
      </div>
      <div className="cy-payment-alert-body">
        <div className="cy-payment-alert-kicker">CyberPhysics · Төлбөрийн мэдэгдэл</div>
        <div className="cy-payment-alert-title">
          {isSuccess && 'Premium амжилттай идэвхжлээ'}
          {isRejected && 'Төлбөр татгалзагдлаа'}
        </div>
        <div className="cy-payment-alert-msg">
          {isSuccess && (
            <>
              <strong>{formatMnt(notification.amount)}</strong> төлбөр баталгаажлаа.
              {notification.paymentCode && (
                <> Код: <code>{notification.paymentCode}</code>.</>
              )}
              {' '}Бүх Premium боломж нээгдлээ.
            </>
          )}
          {isRejected && (
            <>
              <strong>{formatMnt(notification.amount)}</strong>
              {notification.paymentCode && (
                <> (<code>{notification.paymentCode}</code>)</>
              )}
              {' '}төлбөрийг шалгаж татгалзлаа.
              {notification.rejectedReason ? (
                <span className="cy-payment-alert-reason">
                  {' '}Шалтгаан: {notification.rejectedReason}
                </span>
              ) : (
                <span className="cy-payment-alert-reason">
                  {' '}Баримт эсвэл гүйлгээний утга буруу байж болзошгүй. Дахин оролдоно уу.
                </span>
              )}
            </>
          )}
        </div>
        {!compact && isRejected && (
          <Link href="/dashboard/premium" className="cy-payment-alert-link">
            Premium хуудас руу очих →
          </Link>
        )}
      </div>
      <button type="button" className="cy-payment-alert-close" onClick={onDismiss} aria-label="Хаах">
        ×
      </button>
    </div>
  );
}
