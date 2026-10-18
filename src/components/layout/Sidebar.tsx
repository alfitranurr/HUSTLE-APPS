'use client';

import { BarChart3, ChevronsLeft, ChevronsRight, KanbanSquare, LayoutDashboard, LogOut, MessagesSquare, Radar, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { IconButton } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/cn';
import { TONES, type Tone } from '@/lib/tones';

const NAV: { href: string; label: string; icon: typeof LayoutDashboard; tone: Tone }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tone: 'indigo' },
  { href: '/tracker', label: 'Applications', icon: KanbanSquare, tone: 'sky' },
  { href: '/summary', label: 'Insights', icon: BarChart3, tone: 'emerald' },
  { href: '/interviews', label: 'Interview prep', icon: MessagesSquare, tone: 'fuchsia' },
  { href: '/matches', label: 'Job match', icon: Radar, tone: 'violet' },
];

interface SidebarProps {
  ownerName: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm">
        H
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-sm font-bold text-slate-900">Hustle</span>
          <span className="block text-xs text-slate-500">Job search tracker</span>
        </span>
      )}
    </span>
  );
}

export function Sidebar({ ownerName, collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.assign('/login');
    }
  };

  const initials = ownerName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {mobileOpen && (
        <div aria-hidden className="fixed inset-0 z-40 bg-slate-900/30 animate-fade-in md:hidden" onClick={onCloseMobile} />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-[transform,width] duration-200',
          mobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:translate-x-0',
          collapsed ? 'md:w-[4.5rem]' : 'md:w-52'
        )}
        aria-label="Main navigation"
      >
        <div className={cn('flex h-16 items-center justify-between px-4', collapsed && 'md:justify-center md:px-0')}>
          <Link href="/dashboard" onClick={onCloseMobile} className="rounded-lg focus-visible:outline-2 focus-visible:outline-indigo-600">
            <span className="md:hidden">
              <Brand />
            </span>
            <span className="hidden md:block">
              <Brand compact={collapsed} />
            </span>
          </Link>
          <IconButton className="md:hidden" label="Close menu" icon={<X className="size-4" />} onClick={onCloseMobile} />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map(({ href, label, icon: Icon, tone }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={onCloseMobile}
                title={collapsed ? label : undefined}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-indigo-600',
                  collapsed && 'md:justify-center md:px-0',
                  active ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'absolute inset-y-1.5 left-0 w-1 rounded-r-full transition-opacity',
                    TONES[tone].bar,
                    active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
                  )}
                />
                <Icon className={cn('size-5 shrink-0', active ? TONES[tone].text : 'text-slate-400 group-hover:text-slate-600')} />
                <span className={cn(collapsed && 'md:sr-only')}>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-slate-200 p-3">
          <div className={cn('flex items-center gap-3 px-2 py-2', collapsed && 'md:justify-center md:px-0')}>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700 ring-2 ring-indigo-100">
              {initials || 'ME'}
            </span>
            <span className={cn('min-w-0 text-sm font-semibold text-slate-900', collapsed && 'md:sr-only')}>
              <span className="block truncate">{ownerName}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setConfirmingSignOut(true)}
            disabled={signingOut}
            className={cn(
              'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50',
              collapsed && 'md:justify-center md:px-0'
            )}
            title="Sign out"
          >
            <LogOut className="size-5 shrink-0" />
            <span className={cn(collapsed && 'md:sr-only')}>Sign out</span>
          </button>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={cn(
              'hidden w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800 md:flex',
              collapsed && 'md:justify-center md:px-0'
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronsRight className="size-5" /> : <ChevronsLeft className="size-5" />}
            <span className={cn(collapsed && 'md:sr-only')}>Collapse</span>
          </button>
        </div>
      </aside>

      <ConfirmDialog
        open={confirmingSignOut}
        title="Sign out?"
        description="You will need your password to sign in again."
        confirmLabel="Sign out"
        variant="primary"
        loading={signingOut}
        onConfirm={signOut}
        onCancel={() => setConfirmingSignOut(false)}
      />
    </>
  );
}
