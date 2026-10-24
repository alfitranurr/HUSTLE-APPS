'use client';

import { Activity, Ban, Clock, KeyRound, RefreshCw, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { IconButton } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { StatCard } from '@/components/ui/StatCard';
import { useAdminTokens, useAdminUsers, useSystemHealth } from './adminApi';
import { SystemPanel } from './SystemPanel';
import { TokensPanel } from './TokensPanel';
import { UsersPanel, type UserFilter } from './UsersPanel';

type Section = 'users' | 'keys' | 'system';

export function AdminView({ currentUserId }: { currentUserId: string }) {
  const [section, setSection] = useState<Section>('users');
  const [filter, setFilter] = useState<UserFilter>('all');
  const { users, isLoading, mutate } = useAdminUsers();
  const { health, isLoading: healthLoading, mutate: mutateHealth } = useSystemHealth(section === 'system');
  const { mutate: mutateTokens } = useAdminTokens(section === 'keys');

  const count = (status: string) => users.filter((u) => u.status === status).length;
  const showUsers = (next: UserFilter) => {
    setSection('users');
    setFilter(next);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Panel"
        description="Approve new accounts and check system health. Only what account management needs is shown: nobody's applications or activity."
        actions={
          <>
            <SegmentedControl
              label="Section"
              value={section}
              onChange={setSection}
              options={[
                { value: 'users', label: `Users (${users.length})`, icon: <Users className="size-4" /> },
                { value: 'keys', label: 'Access keys', icon: <KeyRound className="size-4" /> },
                { value: 'system', label: 'System', icon: <Activity className="size-4" /> },
              ]}
            />
            <IconButton
              label="Refresh"
              variant="secondary"
              size="md"
              icon={<RefreshCw className="size-4" />}
              onClick={() => void (section === 'users' ? mutate() : section === 'keys' ? mutateTokens() : mutateHealth())}
            />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total" value={users.length} hint="accounts" tone="indigo" icon={<ShieldCheck className="size-4" />} loading={isLoading} onClick={() => showUsers('all')} actionLabel="Show all" />
        <StatCard label="Approved" value={count('approved')} hint="have access" tone="emerald" icon={<UserCheck className="size-4" />} loading={isLoading} onClick={() => showUsers('approved')} actionLabel="Show" />
        <StatCard label="Pending" value={count('pending')} hint="need review" tone="amber" icon={<Clock className="size-4" />} loading={isLoading} onClick={() => showUsers('pending')} actionLabel="Review" />
        <StatCard label="Suspended" value={count('suspended')} hint="no access, data kept" tone="rose" icon={<Ban className="size-4" />} loading={isLoading} onClick={() => showUsers('suspended')} actionLabel="Show" />
      </div>

      {section === 'users' ? (
        <UsersPanel
          users={users}
          loading={isLoading}
          currentUserId={currentUserId}
          filter={filter}
          onFilterChange={setFilter}
          mutate={mutate}
        />
      ) : section === 'keys' ? (
        <TokensPanel />
      ) : (
        <SystemPanel health={health} loading={healthLoading} />
      )}
    </div>
  );
}
