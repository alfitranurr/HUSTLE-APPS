import 'server-only';
import type { AdminSystemStats, AdminUser } from '@/lib/types';
import { must, type DataContext } from '../db';

/**
 * Admin data, all through the admin_* RPCs with the admin's own client: the
 * database checks is_admin again and only returns what account management
 * needs (status, sign-in times, capacity), never anything about how people
 * use Hustle (0005_admin_privacy.sql).
 */

interface AdminUserRow {
  id: string;
  email: string;
  display_name: string | null;
  status: AdminUser['status'];
  is_admin: boolean;
  created_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  reviewed_at: string | null;
}

const iso = (value: string | null) => (value ? new Date(value).toISOString() : '');

export async function listUsers(ctx: DataContext): Promise<AdminUser[]> {
  const rows = must(await ctx.db.rpc('admin_list_users')) as AdminUserRow[];
  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    displayName: row.display_name ?? '',
    status: row.status,
    isAdmin: row.is_admin,
    createdAt: iso(row.created_at),
    emailConfirmedAt: iso(row.email_confirmed_at),
    lastSignInAt: iso(row.last_sign_in_at),
    reviewedAt: iso(row.reviewed_at),
  }));
}

export async function setUserStatus(ctx: DataContext, id: string, status: 'approved' | 'suspended'): Promise<void> {
  must(await ctx.db.rpc('admin_set_status', { target: id, new_status: status }));
}

export async function approveAllPending(ctx: DataContext): Promise<number> {
  return must(await ctx.db.rpc('admin_approve_all_pending')) as number;
}

export async function systemStats(ctx: DataContext): Promise<AdminSystemStats> {
  const s = must(await ctx.db.rpc('admin_system_stats')) as Record<string, number>;
  return {
    usersTotal: s.users_total,
    usersPending: s.users_pending,
    usersApproved: s.users_approved,
    usersSuspended: s.users_suspended,
    activeTokens: s.active_tokens,
    storageBytes: Number(s.storage_bytes),
    databaseBytes: Number(s.database_bytes),
  };
}
