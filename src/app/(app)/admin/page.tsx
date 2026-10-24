import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdminView } from '@/features/admin/AdminView';
import { getCurrentAccount } from '@/lib/server/account';

export const metadata: Metadata = { title: 'Admin Panel' };

/** Admins only; everyone else gets a plain 404. The API and the database check again. */
export default async function AdminPage() {
  const account = await getCurrentAccount();
  if (!account?.isAdmin) notFound();
  return <AdminView currentUserId={account.id} />;
}
