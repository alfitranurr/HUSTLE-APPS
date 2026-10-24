import 'server-only';
import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type AccountStatus = 'pending' | 'approved' | 'suspended';

export interface Account {
  id: string;
  email: string;
  displayName: string;
  status: AccountStatus;
  isAdmin: boolean;
}

/**
 * The signed-in account and its approval status, read once per request.
 * Status and is_admin come from profiles, which no client can write.
 */
export const getCurrentAccount = cache(async (): Promise<Account | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('display_name, status, is_admin')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`profile lookup failed: ${error.message}`);

  const email = typeof data.claims.email === 'string' ? data.claims.email : '';
  return {
    id,
    email,
    displayName: profile?.display_name || email.split('@')[0] || 'Me',
    // No profile row means the signup trigger hasn't run: treat as not approved.
    status: (profile?.status as AccountStatus | undefined) ?? 'pending',
    isAdmin: profile?.is_admin === true,
  };
});

const BUCKET = 'proofs';

/** Every file under {userId}/ in the proofs bucket ({userId}/{jobId}/{file}). */
async function listUserFiles(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const paths: string[] = [];
  const folders = [userId];
  while (folders.length) {
    const folder = folders.pop()!;
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await admin.storage.from(BUCKET).list(folder, { limit: 1000, offset });
      if (error) throw new Error(`storage list failed: ${error.message}`);
      for (const entry of data) {
        // Folders come back without an id.
        if (entry.id) paths.push(`${folder}/${entry.name}`);
        else folders.push(`${folder}/${entry.name}`);
      }
      if (data.length < 1000) break;
    }
  }
  return paths;
}

/**
 * Removes an account for good: proof files first, then the auth user, whose
 * deletion cascades to every table. Callers check who may do this.
 */
export async function deleteAccountCompletely(userId: string) {
  const admin = createAdminClient();
  const paths = await listUserFiles(admin, userId);
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await admin.storage.from(BUCKET).remove(paths.slice(i, i + 100));
    if (error) throw new Error(`storage remove failed: ${error.message}`);
  }
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(`auth delete failed: ${error.message}`);
}
