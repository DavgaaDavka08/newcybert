'use client';

import * as React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

type StatusAlertProps = {
  variant: 'success' | 'error' | 'info';
  title?: string;
  children: React.ReactNode;
  className?: string;
};

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

export function StatusAlert({ variant, title, children, className }: StatusAlertProps) {
  const Icon = ICONS[variant];
  return (
    <Alert
      variant={variant === 'error' ? 'destructive' : 'default'}
      className={cn('mt-2', className)}
    >
      <Icon />
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
