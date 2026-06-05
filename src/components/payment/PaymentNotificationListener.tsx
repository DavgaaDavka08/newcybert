'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAppState } from '@/lib/app-state-context';
import { PaymentAlertBanner } from '@/components/payment/PaymentAlertBanner';
import { usePaymentNotifications } from '@/hooks/usePaymentNotifications';
import { useToast } from '@/components/ui/Toast';

const AUTH_PATHS = ['/login', '/register', '/forgot-password'];

/** Dashboard хуудсанд төлбөрийн баталгаа/татгалзалтын мэдэгдэл (нэг удаа). */
export function PaymentNotificationListener() {
  const pathname = usePathname();
  const { status, update: updateSession } = useSession();
  const { refreshStats } = useAppState();
  const toast = useToast();

  const onAuthPage = AUTH_PATHS.some((p) => pathname?.startsWith(p));
  const onPremiumPage = pathname?.includes('/dashboard/premium');
  const onDashboard = pathname?.startsWith('/dashboard');

  const { notification, dismissNotification } = usePaymentNotifications({
    enabled: status === 'authenticated' && onDashboard && !onPremiumPage && !onAuthPage,
    pollMs: 15_000,
    onSuccess: () => {
      void updateSession?.();
      void refreshStats();
      toast.success('Premium идэвхжлээ! Бүх боломж нээгдлээ.', 'CyberPhysics');
    },
    onRejected: (reason) => {
      toast.error(
        reason ? `Шалтгаан: ${reason}` : 'Дахин оролдоно уу.',
        'Төлбөр татгалзагдлаа',
      );
    },
  });

  if (!notification || onPremiumPage || onAuthPage) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 500,
        width: 'min(520px, calc(100vw - 32px))',
        pointerEvents: 'auto',
      }}
    >
      <PaymentAlertBanner notification={notification} onDismiss={dismissNotification} compact />
    </div>
  );
}
