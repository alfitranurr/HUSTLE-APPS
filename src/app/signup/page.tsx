import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/features/auth/AuthCard';
import { SignupForm } from '@/features/auth/SignupForm';

export const metadata: Metadata = { title: 'Create account' };

export default function SignupPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Track applications, interviews and weekly goals in one place."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
