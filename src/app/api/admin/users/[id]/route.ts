import { z } from 'zod';
import { deleteAccountCompletely } from '@/lib/server/account';
import { NotFoundError } from '@/lib/server/db';
import { HttpError, ok, withAdmin } from '@/lib/server/http';
import { listUsers, setUserStatus } from '@/lib/server/repositories/admin';

type Ctx = { params: Promise<{ id: string }> };

const statusSchema = z.object({ status: z.enum(['approved', 'suspended']) });

/** Approve or suspend an account. The RPC refuses the caller and other admins. */
export const PATCH = withAdmin<Ctx>(async (req, { params }, data) => {
  const { id } = await params;
  const { status } = statusSchema.parse(await req.json());
  await setUserStatus(data, id, status);
  return ok({ id, status });
});

/** Deletes an account with all its data and files. Never yourself or another admin. */
export const DELETE = withAdmin<Ctx>(async (_req, { params }, data, admin) => {
  const { id } = await params;
  if (id === admin.id) throw new HttpError(403, 'You cannot delete your own account here.');
  // Look the target up through the admin RPC, so the database confirms it exists and isn't an admin.
  const target = (await listUsers(data)).find((user) => user.id === id);
  if (!target) throw new NotFoundError('User not found');
  if (target.isAdmin) throw new HttpError(403, 'Admin accounts cannot be deleted.');
  await deleteAccountCompletely(id);
  return ok(null);
});
