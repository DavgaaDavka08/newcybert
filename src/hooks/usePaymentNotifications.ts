'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type PaymentNotification = {
  type: 'success' | 'rejected';
  paymentId: string;
  paymentCode: string;
  amount: number;
  rejectedReason?: string;
  reviewedAt?: string;
};

export type MePayment = {
  _id: string;
  status: string;
  paymentCode?: string;
  amount: number;
  type?: string;
  receiptImage?: string;
  rejectedReason?: string;
  reviewedAt?: string;
};

export type PaymentBankInfo = {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
};

function storageKey(paymentId: string, status: string) {
  return `cp_payment_notify_${paymentId}_${status}`;
}

function isSeen(paymentId: string, status: string) {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(storageKey(paymentId, status)) === '1';
}

export function markPaymentNotificationSeen(paymentId: string, status: 'success' | 'rejected') {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(paymentId, status), '1');
}

function markSeen(paymentId: string, status: string) {
  markPaymentNotificationSeen(paymentId, status as 'success' | 'rejected');
}

function pickNotification(payments: MePayment[]): PaymentNotification | null {
  const sorted = [...payments].sort(
    (a, b) => (b.reviewedAt ? new Date(b.reviewedAt).getTime() : 0) -
      (a.reviewedAt ? new Date(a.reviewedAt).getTime() : 0),
  );

  for (const p of sorted) {
    if (p.status === 'success' && !isSeen(p._id, 'success')) {
      return {
        type: 'success',
        paymentId: p._id,
        paymentCode: p.paymentCode ?? '',
        amount: p.amount,
        reviewedAt: p.reviewedAt,
      };
    }
    if (p.status === 'rejected' && !isSeen(p._id, 'rejected')) {
      return {
        type: 'rejected',
        paymentId: p._id,
        paymentCode: p.paymentCode ?? '',
        amount: p.amount,
        rejectedReason: p.rejectedReason,
        reviewedAt: p.reviewedAt,
      };
    }
  }
  return null;
}

/** Хамгийн сүүлийн баталгаажсан/татгалзсан төлбөр */
export function latestResolvedPayment(payments: MePayment[]): PaymentNotification | null {
  const p = payments.find((x) => x.status === 'success' || x.status === 'rejected');
  if (!p) return null;
  return {
    type: p.status === 'success' ? 'success' : 'rejected',
    paymentId: p._id,
    paymentCode: p.paymentCode ?? '',
    amount: p.amount,
    rejectedReason: p.rejectedReason,
    reviewedAt: p.reviewedAt,
  };
}

type Options = {
  enabled?: boolean;
  pollMs?: number;
  onSuccess?: () => void;
  onRejected?: (reason?: string) => void;
};

export function usePaymentNotifications({
  enabled = true,
  pollMs = 15_000,
  onSuccess,
  onRejected,
}: Options = {}) {
  const [notification, setNotification] = useState<PaymentNotification | null>(null);
  const [resolvedBanner, setResolvedBanner] = useState<PaymentNotification | null>(null);
  const [payments, setPayments] = useState<MePayment[]>([]);
  const [bankInfo, setBankInfo] = useState<PaymentBankInfo | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onRejectedRef = useRef(onRejected);
  const deliveredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onRejectedRef.current = onRejected;
  });

  const deliver = useCallback((item: PaymentNotification) => {
    const key = `${item.paymentId}_${item.type}`;
    if (deliveredRef.current.has(key)) return;
    deliveredRef.current.add(key);
    markSeen(item.paymentId, item.type);

    if (item.type === 'success') {
      onSuccessRef.current?.();
    } else if (item.type === 'rejected') {
      onRejectedRef.current?.(item.rejectedReason);
    }
  }, []);

  const check = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch('/api/payment/me', { cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as {
        payments?: MePayment[];
        bankInfo?: PaymentBankInfo;
      };
      const list = data.payments ?? [];
      setPayments(list);
      if (data.bankInfo) setBankInfo(data.bankInfo);

      const unread = pickNotification(list);
      if (unread) {
        setNotification((prev) => {
          if (prev?.paymentId === unread.paymentId && prev?.type === unread.type) return prev;
          return unread;
        });
        deliver(unread);
      }

      const latestRejected = list.find(
        (p) => p.status === 'rejected' && !isSeen(p._id, 'rejected'),
      );
      if (latestRejected) {
        setResolvedBanner({
          type: 'rejected',
          paymentId: latestRejected._id,
          paymentCode: latestRejected.paymentCode ?? '',
          amount: latestRejected.amount,
          rejectedReason: latestRejected.rejectedReason,
          reviewedAt: latestRejected.reviewedAt,
        });
      } else {
        setResolvedBanner(null);
      }
    } catch {
      /* silent */
    }
  }, [enabled, deliver]);

  useEffect(() => {
    if (!enabled) {
      setNotification(null);
      setResolvedBanner(null);
      setPayments([]);
      return;
    }
    void check();
    const id = setInterval(() => void check(), pollMs);
    return () => clearInterval(id);
  }, [enabled, pollMs, check]);

  function dismissNotification(target?: PaymentNotification | null) {
    const item = target ?? notification ?? resolvedBanner;
    if (item) {
      markSeen(item.paymentId, item.type);
      deliveredRef.current.add(`${item.paymentId}_${item.type}`);
    }
    setNotification(null);
    if (!item || resolvedBanner?.paymentId === item.paymentId) {
      setResolvedBanner(null);
    }
  }

  return {
    notification,
    resolvedBanner,
    payments,
    bankInfo,
    dismissNotification,
    refresh: check,
  };
}
