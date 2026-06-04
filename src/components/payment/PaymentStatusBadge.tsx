'use client';

export type PaymentStatus =
  | 'pending'
  | 'waiting_verification'
  | 'processing'
  | 'success'
  | 'failed'
  | 'rejected';

const CONFIG: Record<PaymentStatus, { label: string; bg: string; color: string; dot: string }> = {
  pending:              { label: 'Хүлээгдэж байна',    bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  waiting_verification: { label: 'Шалгагдаж байна',    bg: '#DBEAFE', color: '#1E40AF', dot: '#3B82F6' },
  processing:           { label: 'Боловсруулж байна',   bg: '#EDE9FE', color: '#5B21B6', dot: '#8B5CF6' },
  success:              { label: 'Баталгаажсан',        bg: '#D1FAE5', color: '#065F46', dot: '#10B981' },
  failed:               { label: 'Амжилтгүй',           bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444' },
  rejected:             { label: 'Татгалзсан',          bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444' },
};

type Props = { status: PaymentStatus; size?: 'sm' | 'md' };

export function PaymentStatusBadge({ status, size = 'md' }: Props) {
  const cfg = CONFIG[status] ?? CONFIG.pending;
  const pad = size === 'sm' ? '2px 8px' : '4px 12px';
  const fs  = size === 'sm' ? 11 : 12;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: pad,
        borderRadius: 20,
        background: cfg.bg,
        color: cfg.color,
        fontSize: fs,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: cfg.dot,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  );
}
