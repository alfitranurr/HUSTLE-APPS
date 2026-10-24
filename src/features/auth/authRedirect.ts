import { safeNextPath } from '@/lib/safeRedirect';

/** Absolute /auth/callback URL for email links, carrying where to go next. */
export function authRedirect(next?: string | null) {
  const url = new URL('/auth/callback', window.location.origin);
  url.searchParams.set('next', safeNextPath(next));
  return url.toString();
}

/** Supabase auth errors, phrased for people. Unknown ones get a generic line. */
export function authErrorMessage(error: { message?: string; code?: string } | null | undefined): string {
  const code = error?.code ?? '';
  const message = (error?.message ?? '').toLowerCase();
  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) return 'Invalid email or password.';
  if (code === 'email_not_confirmed' || message.includes('email not confirmed'))
    return 'Please verify your email first. Check your inbox for the link.';
  if (code === 'user_already_exists' || message.includes('already registered')) return 'An account with this email already exists.';
  if (code === 'weak_password' || message.includes('password should')) return 'Choose a stronger password (at least 8 characters).';
  if (code === 'same_password') return 'Use a password different from your current one.';
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || message.includes('rate limit'))
    return 'Too many attempts. Please wait a minute and try again.';
  return 'Something went wrong. Please try again.';
}
