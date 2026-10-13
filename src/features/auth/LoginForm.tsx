'use client';

import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { apiFetch, errorMessage, jsonRequest } from '@/lib/api';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch('/api/auth/login', jsonRequest('POST', { email, password }));
      window.location.assign('/dashboard');
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border-l-4 border-rose-500 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}

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
        <Field label="Password">
          <Input
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </Field>
        <button
          type="button"
          onClick={() => setShowPassword((s) => !s)}
          className="mt-1.5 inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          {showPassword ? 'Hide password' : 'Show password'}
        </button>
      </div>

      <Button type="submit" loading={loading} disabled={!email || !password} className="w-full">
        Sign in
      </Button>
    </form>
  );
}
