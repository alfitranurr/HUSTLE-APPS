import type { Metadata } from 'next';
import { AuthCard } from '@/features/auth/AuthCard';
import { ResetPasswordForm } from '@/features/auth/ResetPasswordForm';

export const metadata: Metadata = { title: 'Set a new password' };

/** Reached from the reset email via /auth/callback, which signs the user in first (proxy.ts requires it). */
export default function ResetPasswordPage() {
  return (
    <AuthCard title="Set a new password" description="Choose a password you don't use anywhere else.">
      <ResetPasswordForm />
    </AuthCard>
  );
}
