import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getServerEnv } from '@/lib/env';
import { getSupabaseConfig } from './config';

/**
 * Secret-key client: bypasses RLS. Only for work no user session can do
 * (deleting an auth user and their files). Never pass it to a repository.
 */
export function createAdminClient() {
  const { url } = getSupabaseConfig();
  return createClient(url, getServerEnv().SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
