'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AdminPaymentsTable } from '@/components/payment/AdminPaymentsTable';
import { Loading } from '@/components/ui/Loading';
import Link from 'next/link';

export default function AdminPaymentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login?callbackUrl=/admin/payments');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Loading message="Ачааллаж байна…" />
      </div>
    );
  }

  if (!session || session.user?.role !== 'admin') return null;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8FAFC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Top bar */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #E2E8F0',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <Link
          href="/admin"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: '#64748B', textDecoration: 'none', fontSize: 13, fontWeight: 500,
          }}
        >
          ← Admin
        </Link>
        <span style={{ color: '#CBD5E1' }}>|</span>
        <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1E293B' }}>
          💳 Төлбөрийн жагсаалт
        </h1>
        <span style={{
          marginLeft: 'auto', fontSize: 12, color: '#94A3B8',
        }}>
          Банкны шилжүүлгийн баримтуудыг хянах
        </span>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px' }}>
        {/* Legend */}
        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: '14px 20px',
          marginBottom: 20,
          border: '1px solid #E2E8F0',
          display: 'flex',
          gap: 24,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>Статус:</span>
          {[
            { color: '#F59E0B', label: 'Хүлээгдэж байна' },
            { color: '#3B82F6', label: 'Шалгагдаж байна' },
            { color: '#10B981', label: 'Баталгаажсан' },
            { color: '#EF4444', label: 'Татгалзсан' },
          ].map((s) => (
            <span key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#374151' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
              {s.label}
            </span>
          ))}
        </div>

        <div style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          padding: 20,
        }}>
          <AdminPaymentsTable />
        </div>
      </div>
    </div>
  );
}
