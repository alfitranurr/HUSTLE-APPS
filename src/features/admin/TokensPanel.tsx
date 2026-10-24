'use client';

import { KeyRound, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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
        <>
          {/* Same layout as the Users tab: table from md up, stacked cards on phones. */}
          <table className="hidden w-full text-left text-sm md:table">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
              <tr>
                <th scope="col" className="py-3 pr-3 pl-5">Account</th>
                <th scope="col" className="px-3 py-3">Key</th>
                <th scope="col" className="px-3 py-3">Created (WIB)</th>
                <th scope="col" className="px-3 py-3">Last used</th>
                <th scope="col" className="px-3 py-3">Status</th>
                <th scope="col" className="px-3 py-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((token) => (
                <tr key={token.id} className="hover:bg-slate-50/70">
                  <td className="py-3 pr-3 pl-5 font-semibold break-all text-slate-900">{token.email}</td>
                  <td className="px-3 py-3">
                    <span className="block font-medium text-slate-800">{token.name}</span>
                    <code className="text-xs text-slate-500">{token.prefix}…</code>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-slate-600">{wib(token.createdAt)}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-slate-600">{wib(token.lastUsedAt)}</td>
                  <td className="px-3 py-3">
                    <KeyStatus token={token} />
                  </td>
                  <td className="px-3 py-3 pr-5 text-right">
                    <TurnOff token={token} onClick={() => setTurningOff(token)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="divide-y divide-slate-100 md:hidden">
            {visible.map((token) => (
              <li key={token.id} className="space-y-2 p-4">
                <p className="font-semibold break-all text-slate-900">{token.email}</p>
                <p className="text-sm text-slate-700">
                  {token.name} <code className="text-xs text-slate-500">{token.prefix}…</code>
                </p>
                <p className="text-xs text-slate-500">
                  Created {wib(token.createdAt)} · last used {wib(token.lastUsedAt)}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <KeyStatus token={token} />
                  <TurnOff token={token} onClick={() => setTurningOff(token)} />
                </div>
              </li>
            ))}
          </ul>
        </>
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

function KeyStatus({ token }: { token: AdminToken }) {
  if (!token.revokedAt) {
    return (
      <Badge tone="emerald" dot>
        In use
      </Badge>
    );
  }
  return (
    <span className="flex flex-col items-start gap-0.5">
      <Badge tone="rose">{token.revokedByAdmin ? 'Turned off by admin' : 'Turned off by owner'}</Badge>
      <span className="text-xs text-slate-400">{wib(token.revokedAt)}</span>
    </span>
  );
}

function TurnOff({ token, onClick }: { token: AdminToken; onClick: () => void }) {
  if (token.revokedAt) return <span className="text-xs text-slate-400">—</span>;
  return (
    <Button
      size="sm"
      variant="secondary"
      icon={<Trash2 className="size-3.5 text-rose-600" />}
      className="text-rose-700"
      aria-label={`Turn off ${token.name} of ${token.email}`}
      onClick={onClick}
    >
      Turn off
    </Button>
  );
}
