import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseConfig } from './config';

/** Browser client for the auth forms (sign in, sign up, password reset). */
export function createClient() {
  const { url, key } = getSupabaseConfig();
  return createBrowserClient(url, key);
}
