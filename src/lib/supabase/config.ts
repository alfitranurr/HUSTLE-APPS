/**
 * Public Supabase settings, safe for the browser bundle. The literal
 * process.env.NEXT_PUBLIC_* reads are what Next inlines at build time.
 */
export function getSupabaseConfig(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set.');
  }
  return { url: url.replace(/\/+$/, ''), key };
}
