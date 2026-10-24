'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { createClient } from '@/lib/supabase/client';
import { FormAlert } from './AuthCard';
import { authErrorMessage, authRedirect } from './authRedirect';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const { error: resetError } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: authRedirect('/reset-password'),
    });
    setLoading(false);
    if (resetError) setError(authErrorMessage(resetError));
    else setSent(true);
  };

  if (sent) {
    return (
      <div className="mt-6">
        {/* Same message whether or not the account exists. */}
        <FormAlert tone="success">If an account exists for {email.trim()}, a reset link is on its way.</FormAlert>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
      {error && <FormAlert>{error}</FormAlert>}
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
      <Button type="submit" loading={loading} disabled={!email} className="w-full">
        Send reset link
      </Button>
    </form>
  );
}
