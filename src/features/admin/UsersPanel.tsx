'use client';

import { Search, Trash2, UserCheck, UserX, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { KeyedMutator } from 'swr';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field, Input } from '@/components/ui/Field';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { errorMessage } from '@/lib/api';
import type { AccountStatus, AdminUser } from '@/lib/types';
import type { Tone } from '@/lib/tones';
import { approveAll, deleteUser, setUserStatus } from './adminApi';

export type UserFilter = AccountStatus | 'all';

const STATUS_TONE: Record<AccountStatus, Tone> = { pending: 'amber', approved: 'emerald', suspended: 'rose' };

/** Admin and owner are in Jakarta: show sign-up times in WIB whatever the browser zone. */
const WIB = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Jakarta',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const wib = (iso: string) => (iso ? WIB.format(new Date(iso)) : '—');

interface UsersPanelProps {
  users: AdminUser[];
  loading: boolean;
  currentUserId: string;
  filter: UserFilter;
  onFilterChange: (filter: UserFilter) => void;
  mutate: KeyedMutator<AdminUser[]>;
}

export function UsersPanel({ users, loading, currentUserId, filter, onFilterChange, mutate }: UsersPanelProps) {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [suspending, setSuspending] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [approvingAll, setApprovingAll] = useState(false);
  const [confirmApproveAll, setConfirmApproveAll] = useState(false);

  const pending = users.filter((u) => u.status === 'pending').length;
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        (filter === 'all' || u.status === filter) &&
        (!query || `${u.email} ${u.displayName}`.toLowerCase().includes(query))
    );
  }, [users, filter, search]);

  const changeStatus = async (user: AdminUser, status: 'approved' | 'suspended') => {
    setBusyId(user.id);
    try {
      await setUserStatus(user.id, status);
      toast.success(status === 'approved' ? `${user.email} approved.` : `${user.email} suspended.`);
      await mutate();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusyId(null);
      setSuspending(null);
    }
  };

  const runApproveAll = async () => {
    setApprovingAll(true);
    try {
      const { count } = await approveAll();
      toast.success(`${count} ${count === 1 ? 'account' : 'accounts'} approved.`);
      await mutate();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setApprovingAll(false);
      setConfirmApproveAll(false);
    }
  };

  const runDelete = async () => {
    if (!deleting) return;
    setBusyId(deleting.id);
    try {
      await deleteUser(deleting.id);
      toast.success(`${deleting.email} and all of its data were deleted.`);
      await mutate();
      setDeleting(null);
      setDeleteConfirm('');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const actions = (user: AdminUser) => {
    if (user.isAdmin || user.id === currentUserId) {
      return <span className="text-xs text-slate-400">No actions</span>;
    }
    const busy = busyId === user.id;
    return (
      <div className="flex items-center justify-end gap-1.5">
        {user.status === 'approved' ? (
          <Button size="sm" variant="secondary" icon={<UserX className="size-3.5" />} disabled={busy} onClick={() => setSuspending(user)}>
            Suspend
          </Button>
        ) : (
          <Button size="sm" icon={<UserCheck className="size-3.5" />} loading={busy} onClick={() => void changeStatus(user, 'approved')}>
            {user.status === 'suspended' ? 'Restore' : 'Approve'}
          </Button>
        )}
        <IconButton
          label={`Delete ${user.email}`}
          icon={<Trash2 className="size-4" />}
          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          disabled={busy}
          onClick={() => setDeleting(user)}
        />
      </div>
    );
  };

  const badges = (user: AdminUser) => (
    <>
      {user.isAdmin && <Badge tone="sky">Admin</Badge>}
      {user.id === currentUserId && <Badge>You</Badge>}
      {!user.emailConfirmedAt && <Badge tone="orange">Email not verified</Badge>}
    </>
  );

  return (
    <Card accent="indigo">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search accounts</span>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search email or name…" className="pl-9" />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            label="Filter accounts"
            value={filter}
            onChange={onFilterChange}
            options={[
              { value: 'all', label: `All ${users.length}` },
              { value: 'pending', label: `Pending ${pending}` },
              { value: 'approved', label: `Approved ${users.filter((u) => u.status === 'approved').length}` },
              { value: 'suspended', label: `Suspended ${users.filter((u) => u.status === 'suspended').length}` },
            ]}
          />
          <Button icon={<UserCheck className="size-4" />} disabled={pending === 0} loading={approvingAll} onClick={() => setConfirmApproveAll(true)}>
            Approve all ({pending})
          </Button>
        </div>
      </div>

      {loading ? (
        <SkeletonRows rows={4} className="p-4" />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5" />}
          title={users.length === 0 ? 'No accounts yet' : 'No accounts match'}
          description={filter === 'pending' ? 'Nobody is waiting for approval.' : undefined}
          className="m-4"
        />
      ) : (
        <>
          {/* Table from md up; stacked cards on phones. */}
          <table className="hidden w-full text-left text-sm md:table">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
              <tr>
                <th scope="col" className="py-3 pr-3 pl-5">Account</th>
                <th scope="col" className="px-3 py-3">Registered (WIB)</th>
                <th scope="col" className="px-3 py-3">Last sign-in</th>
                <th scope="col" className="px-3 py-3">Status</th>
                <th scope="col" className="px-3 py-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/70">
                  <td className="py-3 pr-3 pl-5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold break-all text-slate-900">{user.email}</span>
                      {badges(user)}
                    </div>
                    {user.displayName && <p className="text-xs text-slate-500">{user.displayName}</p>}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-slate-600">{wib(user.createdAt)}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-slate-600">{wib(user.lastSignInAt)}</td>
                  <td className="px-3 py-3">
                    <Badge tone={STATUS_TONE[user.status]} dot>
                      {user.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 pr-5 text-right">{actions(user)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="divide-y divide-slate-100 md:hidden">
            {visible.map((user) => (
              <li key={user.id} className="space-y-2 p-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold break-all text-slate-900">{user.email}</span>
                  {badges(user)}
                </div>
                <p className="text-xs text-slate-500">
                  Registered {wib(user.createdAt)} · last sign-in {wib(user.lastSignInAt)}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <Badge tone={STATUS_TONE[user.status]} dot>
                    {user.status}
                  </Badge>
                  {actions(user)}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <ConfirmDialog
        open={confirmApproveAll}
        title={`Approve ${pending} ${pending === 1 ? 'account' : 'accounts'}?`}
        description="Every pending account gets access right away. Suspended accounts stay suspended."
        confirmLabel="Approve all"
        variant="primary"
        loading={approvingAll}
        onConfirm={() => void runApproveAll()}
        onCancel={() => setConfirmApproveAll(false)}
      />

      <ConfirmDialog
        open={suspending !== null}
        title="Suspend access?"
        description={`${suspending?.email ?? ''} will no longer be able to use Hustle, including API tokens. Their data is kept and you can restore access later.`}
        confirmLabel="Suspend"
        loading={busyId !== null && busyId === suspending?.id}
        onConfirm={() => suspending && void changeStatus(suspending, 'suspended')}
        onCancel={() => setSuspending(null)}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this account?"
        description={`${deleting?.email ?? ''} and all of its applications, interview prep, proof files and tokens will be deleted permanently.`}
        confirmLabel="Delete account"
        loading={busyId !== null && busyId === deleting?.id}
        onConfirm={() => {
          if (deleteConfirm.trim().toLowerCase() === deleting?.email.toLowerCase()) void runDelete();
          else toast.error('Type the email address exactly to confirm.');
        }}
        onCancel={() => {
          setDeleting(null);
          setDeleteConfirm('');
        }}
      >
        <Field label="Type the email to confirm" className="mt-4">
          <Input type="email" autoComplete="off" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder={deleting?.email} />
        </Field>
      </ConfirmDialog>
    </Card>
  );
}
