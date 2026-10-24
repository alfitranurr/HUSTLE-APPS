'use client';

import { Clock, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { createClient } from '@/lib/supabase/client';
import { FormAlert } from './AuthCard';
import { authErrorMessage, authRedirect } from './authRedirect';
import { PasswordInput } from './PasswordInput';

const MIN_PASSWORD = 8;

export function SignupForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    setLoading(true);
    setError(null);
    const { error: signUpError } = await createClient().auth.signUp({
      email: email.trim(),
      password,
      // full_name becomes the display name (private.handle_new_user).
      options: { emailRedirectTo: authRedirect('/dashboard'), data: { full_name: name.trim() } },
    });
    setLoading(false);
    if (signUpError) setError(authErrorMessage(signUpError));
    else setSentTo(email.trim());
  };

  if (sentTo) return <SignupDone email={sentTo} />;

  return (
    <div className="mt-6">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <FormAlert>{error}</FormAlert>}
        <Field label="Name">
          <Input autoComplete="name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
        </Field>
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
        <PasswordInput
          label="Password"
          hint={`At least ${MIN_PASSWORD} characters.`}
          autoComplete="new-password"
          minLength={MIN_PASSWORD}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <Button type="submit" loading={loading} disabled={!email || !password} className="w-full">
          Create account
        </Button>
        <p className="text-xs text-slate-500">New accounts are reviewed by the admin before they can be used.</p>
      </form>
    </div>
  );
}

/** Shown right after sign-up: verify the email, then wait for the admin. */
function SignupDone({ email }: { email: string }) {
  return (
    <div className="mt-6 space-y-4">
      <ol className="space-y-3">
        <li className="flex gap-3 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-indigo-600" />
          <span>
            <span className="block font-semibold">1. Verify your email</span>
            We sent a link to <span className="font-semibold break-all">{email}</span>. Open it to confirm your address.
          </span>
        </li>
        <li className="flex gap-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          <Clock className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <span>
            <span className="block font-semibold">2. Wait for admin approval</span>
            Your account will be reviewed by the admin. You can sign in after verifying, but your workspace opens once
            the admin approves it.
          </span>
        </li>
      </ol>
      <Link
        href="/login"
        className="block text-center text-sm font-semibold text-indigo-600 hover:text-indigo-500"
      >
        Back to sign in
      </Link>
    </div>
  );
}
