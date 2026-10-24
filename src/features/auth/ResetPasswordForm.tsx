'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import { FormAlert } from './AuthCard';
import { authErrorMessage } from './authRedirect';
import { PasswordInput } from './PasswordInput';

const MIN_PASSWORD = 8;

export function ResetPasswordForm() {
  const router = useRouter();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < MIN_PASSWORD) return setError(`Password must be at least ${MIN_PASSWORD} characters.`);
    if (password !== confirm) return setError('The two passwords do not match.');
    setLoading(true);
    setError(null);
    const { error: updateError } = await createClient().auth.updateUser({ password });
    if (updateError) {
      setError(authErrorMessage(updateError));
      setLoading(false);
      return;
    }
    toast.success('Password updated.');
    router.replace('/dashboard');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
      {error && <FormAlert>{error}</FormAlert>}
      <PasswordInput
        label="New password"
        hint={`At least ${MIN_PASSWORD} characters.`}
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
      />
      <PasswordInput
        label="Repeat new password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        disabled={loading}
      />
      <Button type="submit" loading={loading} disabled={!password || !confirm} className="w-full">
        Save new password
      </Button>
    </form>
  );
}
