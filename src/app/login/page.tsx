import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/features/auth/AuthCard';
import { LoginForm } from '@/features/auth/LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

const ERRORS: Record<string, string> = {
  link: 'That link is invalid or has expired. Please sign in or request a new one.',
};

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const { next, error } = await searchParams;
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to continue your job search."
      footer={
        <>
          New to Hustle?{' '}
          <Link href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm
        next={typeof next === 'string' ? next : undefined}
        initialError={typeof error === 'string' ? ERRORS[error] : undefined}
      />
    </AuthCard>
  );
}
