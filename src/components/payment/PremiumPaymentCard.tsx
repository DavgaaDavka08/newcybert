'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { formatMnt } from '@/lib/premium-pricing';
import { PaymentStatusBadge, type PaymentStatus } from './PaymentStatusBadge';
import { ReceiptUploader } from './ReceiptUploader';

export type BankTransferInfo = {
  paymentId: string;
  paymentCode: string;
  amount: number;
  plan: string;
  months: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status?: PaymentStatus;
  receiptImage?: string;
};

type Props = {
  info: BankTransferInfo;
  onReceiptUploaded?: (receiptUrl: string) => void;
  onClose?: () => void;
  /** Called when admin approves — triggers session refresh */
  onApproved?: () => void;
};

export function PremiumPaymentCard({ info, onReceiptUploaded, onClose, onApproved }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState<string | null>(null);
  const [status, setStatus] = useState<PaymentStatus>(info.status ?? 'pending');
  const [receiptImage, setReceiptImage] = useState(info.receiptImage ?? '');
  const [checking, setChecking] = useState(false);

  // Poll for approval every 15s when waiting for verification
  const checkStatus = useCallback(async () => {
    if (status === 'success' || status === 'rejected' || status === 'failed') return;
    try {
      const res = await fetch('/api/payment/me', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json() as { payments?: { _id: string; status: PaymentStatus }[] };
      const found = data.payments?.find((p) => p._id === info.paymentId);
      if (!found) return;
      if (found.status !== status) {
        setStatus(found.status);
        if (found.status === 'success') {
          onApproved?.();
          router.refresh(); // refresh server components / session
        }
      }
    } catch { /* silent */ }
  }, [status, info.paymentId, onApproved, router]);

  useEffect(() => {
    if (status === 'waiting_verification') {
      const id = setInterval(() => void checkStatus(), 15_000);
      return () => clearInterval(id);
    }
  }, [status, checkStatus]);

  async function handleManualCheck() {
    setChecking(true);
    await checkStatus();
    setChecking(false);
  }

  function copy(value: string, key: string) {
    navigator.clipboard.writeText(value).catch(() => null);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleUploaded(url: string) {
    setReceiptImage(url);
    setStatus('waiting_verification');
    onReceiptUploaded?.(url);
  }

  const canUpload = status === 'pending' || (status === 'waiting_verification' && !receiptImage);

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
      padding: 28,
      maxWidth: 420,
      width: '100%',
      position: 'relative',
    }}>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 12, right: 14,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 20, color: '#94A3B8', lineHeight: 1,
          }}
          aria-label="Хаах"
        >
          ×
        </button>
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 32, marginBottom: 6 }}>🔥</div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1E293B' }}>
          CyberPhysics Premium
        </h2>
        <div style={{
          fontSize: 28, fontWeight: 800, color: '#6366F1', margin: '8px 0 4px',
        }}>
          {formatMnt(info.amount)}
        </div>
        <div style={{ fontSize: 13, color: '#64748B' }}>
          {info.months} сарын Premium эрх
        </div>
        <div style={{ marginTop: 8 }}>
          <PaymentStatusBadge status={status} />
        </div>
      </div>

      {/* Config warning */}
      {(!info.accountNumber || info.accountNumber.includes('XXXX')) && (
        <div style={{
          background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10,
          padding: '8px 14px', marginBottom: 12, fontSize: 12, color: '#92400E',
        }}>
          ⚠️ Банкны данс тохируулаагүй байна. <strong>BANK_ACCOUNT</strong> env нэмнэ үү.
        </div>
      )}

      {/* Bank details */}
      <div style={{
        background: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Банкны мэдээлэл
        </div>

        <InfoRow label="Банк" value={info.bankName} />
        <InfoRow
          label="Данс"
          value={info.accountNumber}
          onCopy={info.accountNumber ? () => copy(info.accountNumber, 'account') : undefined}
          copied={copied === 'account'}
        />
        <InfoRow label="Эзэмшигч" value={info.accountHolder} />

        <div style={{
          marginTop: 12,
          padding: '10px 14px',
          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
          borderRadius: 10,
        }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginBottom: 4, fontWeight: 600 }}>
            ⚠️  ГҮЙЛГЭЭНИЙ УТГА — яг энэ кодыг бичнэ
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: 2, fontFamily: 'monospace' }}>
              {info.paymentCode}
            </span>
            <button
              onClick={() => copy(info.paymentCode, 'code')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none', borderRadius: 6, padding: '4px 10px',
                color: '#fff', fontSize: 11, cursor: 'pointer', fontWeight: 600,
                transition: 'background 0.15s',
              }}
            >
              {copied === 'code' ? '✓ Хуулсан' : 'Хуулах'}
            </button>
          </div>
        </div>
      </div>

      {/* Steps */}
      <ol style={{
        margin: '0 0 20px 0',
        padding: '0 0 0 18px',
        fontSize: 13,
        color: '#475569',
        lineHeight: 1.7,
      }}>
        <li>Банкны аппаараа дээрх данс руу <strong>{formatMnt(info.amount)}</strong> шилжүүлнэ</li>
        <li>Гүйлгээний утга: <strong style={{ color: '#6366F1' }}>{info.paymentCode}</strong></li>
        <li>Гүйлгээний баримтыг доор байршуулна уу</li>
        <li>Admin баталгаажуулсны дараа Premium нээгдэнэ</li>
      </ol>

      {/* Receipt section */}
      {status === 'success' ? (
        <div style={{
          textAlign: 'center', padding: '16px 0',
          color: '#059669', fontSize: 15, fontWeight: 600,
        }}>
          ✅ Premium идэвхжлээ! Баярлалаа.
        </div>
      ) : status === 'rejected' ? (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: 10, padding: 14, textAlign: 'center',
          color: '#DC2626', fontSize: 13,
        }}>
          ❌ Баримтыг admin татгалзлаа. Дахин шинэ гүйлгээ хийж явуулна уу.
        </div>
      ) : status === 'waiting_verification' && receiptImage ? (
        <div style={{
          background: '#EFF6FF', border: '1px solid #BFDBFE',
          borderRadius: 10, padding: 14, textAlign: 'center',
        }}>
          <div style={{ color: '#1D4ED8', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
            📬 Баримт хүлээн авлаа
          </div>
          <div style={{ color: '#3B82F6', fontSize: 12, marginBottom: 10 }}>
            Admin шалгаж байна. Баталгаажсан даруйд нээгдэнэ.
          </div>
          <img
            src={receiptImage}
            alt="Гүйлгээний баримт"
            style={{
              marginTop: 4, maxWidth: '100%', maxHeight: 120,
              borderRadius: 8, objectFit: 'cover', marginBottom: 12,
            }}
          />
          <button
            onClick={() => void handleManualCheck()}
            disabled={checking}
            style={{
              padding: '6px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: checking ? '#DBEAFE' : '#3B82F6', color: '#fff',
              border: 'none', cursor: checking ? 'default' : 'pointer',
              opacity: checking ? 0.8 : 1,
            }}
          >
            {checking ? '⏳ Шалгаж байна…' : '🔄 Статус шалгах'}
          </button>
        </div>
      ) : canUpload ? (
        <ReceiptUploader
          paymentId={info.paymentId}
          onUploaded={handleUploaded}
        />
      ) : null}
    </div>
  );
}

function InfoRow({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 8, gap: 8,
    }}>
      <span style={{ fontSize: 12, color: '#94A3B8', minWidth: 80 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', fontFamily: 'monospace' }}>
          {value || '—'}
        </span>
        {onCopy && value && (
          <button
            onClick={onCopy}
            style={{
              background: 'none', border: '1px solid #CBD5E1', borderRadius: 4,
              padding: '1px 6px', fontSize: 10, cursor: 'pointer', color: '#64748B',
            }}
          >
            {copied ? '✓' : 'Хуулах'}
          </button>
        )}
      </div>
    </div>
  );
}
