import { z } from 'zod';
import { getCurrentAccount, deleteAccountCompletely } from '@/lib/server/account';
import { fail, ok } from '@/lib/server/http';
import { createClient } from '@/lib/supabase/server';

const deleteSchema = z.object({ confirmEmail: z.string().trim().toLowerCase().max(254) });

/**
 * Deletes the caller's own account and everything in it. Works for pending
 * and suspended accounts too, so not wrapped in withAuth (which needs approval).
 */
export async function DELETE(req: Request) {
  try {
    const account = await getCurrentAccount();
    if (!account) return fail(401, 'Unauthorized');
    if (account.isAdmin) return fail(403, 'Admin accounts cannot be deleted from the app.');

    const parsed = deleteSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success || parsed.data.confirmEmail !== account.email.toLowerCase()) {
      return fail(400, 'Type your email address to confirm.');
    }

    await deleteAccountCompletely(account.id);
    // The auth user is gone; clear the now-dead session cookies too.
    await (await createClient()).auth.signOut({ scope: 'local' }).catch(() => undefined);
    return ok(null);
  } catch (error) {
    console.error('[account] delete failed:', error instanceof Error ? error.message : error);
    return fail(500, 'Could not delete the account. Please try again.');
  }
}
