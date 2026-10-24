import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/features/auth/AuthCard';
import { ForgotPasswordForm } from '@/features/auth/ForgotPasswordForm';

export const metadata: Metadata = { title: 'Reset password' };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot your password?"
      description="Enter your email and we will send you a link to set a new one."
      footer={
        <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
