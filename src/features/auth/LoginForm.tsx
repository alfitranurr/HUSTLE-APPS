'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { safeNextPath } from '@/lib/safeRedirect';
import { createClient } from '@/lib/supabase/client';
import { FormAlert } from './AuthCard';
import { authErrorMessage, authRedirect } from './authRedirect';
import { PasswordInput } from './PasswordInput';

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [resent, setResent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResent(false);
    const { error: signInError } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) {
      setUnconfirmed(signInError.code === 'email_not_confirmed');
      setError(authErrorMessage(signInError));
      setLoading(false);
      return;
    }
    // The (app) layout sends pending accounts on to /pending.
    router.replace(safeNextPath(next));
    router.refresh();
  };

  const resend = async () => {
    const { error: resendError } = await createClient().auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: authRedirect(next) },
    });
    if (resendError) setError(authErrorMessage(resendError));
    else setResent(true);
  };

  return (
    <div className="mt-6">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <FormAlert>
            {error}
            {unconfirmed && !resent && (
              <button type="button" onClick={resend} className="mt-1 block cursor-pointer font-semibold underline">
                Resend verification email
              </button>
            )}
          </FormAlert>
        )}
        {resent && <FormAlert tone="success">Verification email sent. Check your inbox.</FormAlert>}

        <Field label="Email">
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            placeholder="you@example.com"
          />
        </Field>

        <div>
          <PasswordInput
            label="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <Link href="/forgot-password" className="float-right -mt-5 text-xs font-medium text-indigo-600 hover:text-indigo-500">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={loading} disabled={!email || !password} className="w-full">
          Sign in
        </Button>
      </form>
    </div>
  );
}
