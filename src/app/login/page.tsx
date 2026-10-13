import type { Metadata } from 'next';
import { Brand } from '@/components/layout/Sidebar';
import { LoginForm } from '@/features/auth/LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-indigo-600" />
          <h1 className="text-xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to continue your job search.</p>
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">Private workspace · access is restricted</p>
      </div>
    </main>
  );
}
