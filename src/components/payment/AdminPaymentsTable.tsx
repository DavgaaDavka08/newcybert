'use client';

import { useState, useEffect, useCallback } from 'react';
import { PaymentStatusBadge, type PaymentStatus } from './PaymentStatusBadge';

type PaymentRow = {
  _id: string;
  userId: { firstName?: string; lastName?: string; email?: string } | null;
  paymentCode?: string;
  amount: number;
  type: string;
  status: PaymentStatus;
  receiptImage?: string;
  rejectedReason?: string;
  reviewedBy?: string;
  createdAt: string;
  paidAt?: string;
};

type PageData = {
  payments: PaymentRow[];
  total: number;
  totalPages: number;
};

const STATUS_FILTERS = [
  { value: '', label: 'Бүгд' },
  { value: 'pending', label: 'Хүлээгдэж байна' },
  { value: 'waiting_verification', label: 'Шалгагдаж байна' },
  { value: 'success', label: 'Баталгаажсан' },
  { value: 'rejected', label: 'Татгалзсан' },
];

function fmtDate(s: string) {
  return new Date(s).toLocaleString('mn-MN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtMnt(n: number) {
  return `${n.toLocaleString('en-US')}₮`;
}

export function AdminPaymentsTable() {
  const [data, setData] = useState<PageData | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; code: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [viewReceipt, setViewReceipt] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/payments?${params}`, { cache: 'no-store' });
      if (res.ok) setData(await res.json() as PageData);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  function notify(text: string, ok: boolean) {
    setMessage({ text, ok });
    setTimeout(() => setMessage(null), 4000);
  }

  async function approve(paymentId: string) {
    setActionLoading(paymentId);
    try {
      const res = await fetch('/api/admin/payments/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      });
      const d = await res.json() as { ok?: boolean; error?: string };
      if (res.ok && d.ok) {
        notify('✅ Амжилттай баталгаажуулсан. Premium идэвхжлээ.', true);
        void load();
      } else {
        notify(`❌ ${d.error ?? 'Алдаа гарлаа'}`, false);
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function reject() {
    if (!rejectModal) return;
    if (rejectReason.trim().length < 3) {
      notify('Татгалзах шалтгаанаа бичнэ үү (хамгийн багадаа 3 тэмдэгт)', false);
      return;
    }
    setActionLoading(rejectModal.id);
    try {
      const res = await fetch('/api/admin/payments/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: rejectModal.id, reason: rejectReason }),
      });
      const d = await res.json() as { ok?: boolean; error?: string };
      if (res.ok && d.ok) {
        notify('Татгалзлаа.', true);
        setRejectModal(null);
        setRejectReason('');
        void load();
      } else {
        notify(`❌ ${d.error ?? 'Алдаа гарлаа'}`, false);
      }
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: '1px solid',
                borderColor: statusFilter === f.value ? '#6366F1' : '#E2E8F0',
                background: statusFilter === f.value ? '#EEF2FF' : '#fff',
                color: statusFilter === f.value ? '#6366F1' : '#64748B',
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={load}
          style={{
            marginLeft: 'auto', padding: '5px 14px', borderRadius: 8, fontSize: 12,
            border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', color: '#374151',
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Toast */}
      {message && (
        <div style={{
          padding: '10px 16px', borderRadius: 8, marginBottom: 12, fontSize: 13, fontWeight: 600,
          background: message.ok ? '#D1FAE5' : '#FEE2E2',
          color: message.ok ? '#065F46' : '#991B1B',
        }}>
          {message.text}
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #E2E8F0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              {['Хэрэглэгч', 'И-мэйл', 'Код', 'Дүн', 'Баримт', 'Статус', 'Огноо', 'Үйлдэл'].map((h) => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#64748B', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#94A3B8' }}>
                  Ачааллаж байна…
                </td>
              </tr>
            ) : !data?.payments.length ? (
              <tr>
                <td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#94A3B8' }}>
                  Мэдээлэл олдсонгүй
                </td>
              </tr>
            ) : (
              data.payments.map((p) => {
                const user = typeof p.userId === 'object' && p.userId ? p.userId : null;
                const name = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || '—' : '—';
                const email = user?.email ?? '—';
                const busy = actionLoading === p._id;

                return (
                  <tr key={p._id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.1s' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1E293B' }}>{name}</td>
                    <td style={{ padding: '10px 12px', color: '#64748B', fontSize: 12 }}>{email}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        fontFamily: 'monospace', fontWeight: 700, fontSize: 13,
                        background: '#EEF2FF', color: '#4F46E5', padding: '2px 8px', borderRadius: 6,
                      }}>
                        {p.paymentCode ?? '—'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#059669' }}>
                      {fmtMnt(p.amount)}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {p.receiptImage ? (
                        <button
                          onClick={() => setViewReceipt(p.receiptImage!)}
                          style={{
                            padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                            background: '#DBEAFE', color: '#1D4ED8', border: 'none', cursor: 'pointer',
                          }}
                        >
                          Харах
                        </button>
                      ) : (
                        <span style={{ color: '#CBD5E1', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <PaymentStatusBadge status={p.status} size="sm" />
                    </td>
                    <td style={{ padding: '10px 12px', color: '#94A3B8', fontSize: 11, whiteSpace: 'nowrap' }}>
                      {fmtDate(p.createdAt)}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {p.status === 'waiting_verification' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            disabled={busy}
                            onClick={() => void approve(p._id)}
                            style={{
                              padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                              background: busy ? '#D1FAE5' : '#10B981', color: '#fff',
                              border: 'none', cursor: busy ? 'default' : 'pointer',
                              opacity: busy ? 0.7 : 1,
                            }}
                          >
                            {busy ? '…' : 'Зөвшөөрөх'}
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => setRejectModal({ id: p._id, code: p.paymentCode ?? '' })}
                            style={{
                              padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                              background: '#FEE2E2', color: '#DC2626',
                              border: 'none', cursor: busy ? 'default' : 'pointer',
                            }}
                          >
                            Татгалзах
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#CBD5E1', fontSize: 12 }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            style={{ padding: '5px 14px', borderRadius: 8, border: '1px solid #E2E8F0', cursor: page <= 1 ? 'default' : 'pointer', background: '#fff', color: '#374151', opacity: page <= 1 ? 0.4 : 1 }}
          >
            ← Өмнөх
          </button>
          <span style={{ padding: '5px 14px', fontSize: 13, color: '#64748B' }}>
            {page} / {data.totalPages} ({data.total} нийт)
          </span>
          <button
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
            style={{ padding: '5px 14px', borderRadius: 8, border: '1px solid #E2E8F0', cursor: page >= data.totalPages ? 'default' : 'pointer', background: '#fff', color: '#374151', opacity: page >= data.totalPages ? 0.4 : 1 }}
          >
            Дараах →
          </button>
        </div>
      )}

      {/* Receipt viewer */}
      {viewReceipt && (
        <div
          onClick={() => setViewReceipt(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: 600, width: '100%' }}>
            <button
              onClick={() => setViewReceipt(null)}
              style={{
                position: 'absolute', top: -36, right: 0, background: 'none', border: 'none',
                color: '#fff', fontSize: 28, cursor: 'pointer', lineHeight: 1,
              }}
            >
              ×
            </button>
            <img
              src={viewReceipt}
              alt="Гүйлгээний баримт"
              style={{ width: '100%', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}
            />
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div
          onClick={() => setRejectModal(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 16, padding: 28, maxWidth: 400, width: '100%',
              boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 16, color: '#1E293B' }}>
              Татгалзах — {rejectModal.code}
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748B' }}>
              Татгалзах шалтгаан (заавал — хэрэглэгчид харагдана):
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Жишээ: Гүйлгээний утга буруу, дүн дутуу…"
              rows={3}
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0',
                borderRadius: 8, fontSize: 13, resize: 'vertical', boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                onClick={() => setRejectModal(null)}
                style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: 13 }}
              >
                Болих
              </button>
              <button
                onClick={() => void reject()}
                disabled={!!actionLoading}
                style={{
                  padding: '8px 18px', borderRadius: 8, background: '#EF4444',
                  color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  opacity: actionLoading ? 0.7 : 1,
                }}
              >
                {actionLoading ? '…' : 'Татгалзах'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
