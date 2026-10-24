'use client';

import { KeyRound, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input, Select } from '@/components/ui/Field';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { errorMessage } from '@/lib/api';
import type { AdminToken } from '@/lib/types';
import { turnOffAllKeys, turnOffKey, useAdminTokens } from './adminApi';

const WIB = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Jakarta',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const wib = (iso: string) => (iso ? WIB.format(new Date(iso)) : '—');

type KeyFilter = 'active' | 'all';

/**
 * Every account's access keys (MCP). Admins can turn keys off, one at a time
 * or all of an account's at once; they never see a key itself.
 */
export function TokensPanel() {
  const toast = useToast();
  const { tokens, isLoading, mutate } = useAdminTokens(true);
  const [filter, setFilter] = useState<KeyFilter>('active');
  const [account, setAccount] = useState('');
  const [search, setSearch] = useState('');
  const [turningOff, setTurningOff] = useState<AdminToken | null>(null);
  const [turningOffAll, setTurningOffAll] = useState<{ userId: string; email: string; count: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const accounts = useMemo(
    () => [...new Map(tokens.map((t) => [t.userId, t.email])).entries()].sort((a, b) => a[1].localeCompare(b[1])),
    [tokens]
  );
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tokens.filter(
      (t) =>
        (filter === 'all' || !t.revokedAt) &&
        (!account || t.userId === account) &&
        (!query || `${t.email} ${t.name} ${t.prefix}`.toLowerCase().includes(query))
    );
  }, [tokens, filter, account, search]);

  const activeFor = (userId: string) => tokens.filter((t) => t.userId === userId && !t.revokedAt).length;
  const activeCount = tokens.filter((t) => !t.revokedAt).length;

  const run = async (action: () => Promise<string>) => {
    setBusy(true);
    try {
      toast.success(await action());
      await mutate();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
      setTurningOff(null);
      setTurningOffAll(null);
    }
  };

  const selectedEmail = accounts.find(([id]) => id === account)?.[1] ?? '';

  return (
    <Card accent="teal">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search keys</span>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search email, key name or prefix…" className="pl-9" />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="Account"
            placeholder="All accounts"
            options={accounts.map(([value, label]) => ({ value, label }))}
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className="min-w-48"
          />
          <SegmentedControl
            label="Show keys"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'active', label: `In use ${activeCount}` },
              { value: 'all', label: `All ${tokens.length}` },
            ]}
          />
          {account && (
            <Button
              variant="danger"
              icon={<Trash2 className="size-4" />}
              disabled={activeFor(account) === 0}
              onClick={() => setTurningOffAll({ userId: account, email: selectedEmail, count: activeFor(account) })}
            >
              Turn off all ({activeFor(account)})
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <SkeletonRows rows={4} className="p-4" />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<KeyRound className="size-5" />}
          title={tokens.length === 0 ? 'No access keys yet' : 'No keys match'}
          description={tokens.length === 0 ? 'Keys appear here once someone creates one on the Connect AI page.' : undefined}
          className="m-4"
        />
      ) : (
        <ul className="divide-y divide-slate-100">
          {visible.map((token) => (
            <li key={token.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <KeyRound className={token.revokedAt ? 'size-4 shrink-0 text-slate-300' : 'size-4 shrink-0 text-teal-600'} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold break-all text-slate-900">{token.email}</span>
                  <span className="text-slate-400">·</span>
                  <span className="font-medium text-slate-700">{token.name}</span>
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">{token.prefix}…</code>
                  {token.revokedAt ? (
                    <Badge tone="rose">{token.revokedByAdmin ? 'Turned off by admin' : 'Turned off by owner'}</Badge>
                  ) : (
                    <Badge tone="emerald" dot>
                      In use
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  Created {wib(token.createdAt)} (WIB) · last used {wib(token.lastUsedAt)}
                  {token.revokedAt && ` · turned off ${wib(token.revokedAt)}`}
                </p>
              </div>
              {!token.revokedAt && (
                <IconButton
                  label={`Turn off ${token.name} of ${token.email}`}
                  icon={<Trash2 className="size-4" />}
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  onClick={() => setTurningOff(token)}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={turningOff !== null}
        title="Turn off this access key?"
        description={`"${turningOff?.name ?? ''}" of ${turningOff?.email ?? ''} stops working right away. The owner will see it was turned off by an admin and can create a new one.`}
        confirmLabel="Turn off"
        loading={busy}
        onConfirm={() =>
          turningOff &&
          void run(async () => {
            const { turnedOff } = await turnOffKey(turningOff.id);
            return turnedOff ? `Key "${turningOff.name}" turned off.` : 'That key was already off.';
          })
        }
        onCancel={() => setTurningOff(null)}
      />

      <ConfirmDialog
        open={turningOffAll !== null}
        title={`Turn off all keys of ${turningOffAll?.email ?? ''}?`}
        description={`${turningOffAll?.count ?? 0} access ${turningOffAll?.count === 1 ? 'key stops' : 'keys stop'} working right away. To block the whole account instead, suspend it on the Users tab.`}
        confirmLabel="Turn off all"
        loading={busy}
        onConfirm={() =>
          turningOffAll &&
          void run(async () => {
            const { count } = await turnOffAllKeys(turningOffAll.userId);
            return `${count} ${count === 1 ? 'key' : 'keys'} turned off.`;
          })
        }
        onCancel={() => setTurningOffAll(null)}
      />
    </Card>
  );
}
