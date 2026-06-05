// src/app/providers.tsx
"use client";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/Toast";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { PaymentNotificationListener } from "@/components/payment/PaymentNotificationListener";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ConfirmProvider>
        <ToastProvider>
          <PaymentNotificationListener />
          {children}
        </ToastProvider>
      </ConfirmProvider>
    </SessionProvider>
  );
}
