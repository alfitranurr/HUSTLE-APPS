'use client';

import { Menu } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { IconButton } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { Brand, Sidebar } from './Sidebar';

export function AppShell({ ownerName, children }: { ownerName: string; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-white">
      <a
        href="#main"
        className="sr-only z-[70] rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <Sidebar
        ownerName={ownerName}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur md:hidden">
        <div aria-hidden className="accent-rainbow h-1" />
        <div className="flex h-14 items-center justify-between px-4">
          <Brand />
          <IconButton label="Open menu" icon={<Menu className="size-5" />} onClick={() => setMobileOpen(true)} />
        </div>
      </header>

      <div className={cn('transition-[padding] duration-200', collapsed ? 'md:pl-[72px]' : 'md:pl-60')}>
        <main id="main" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
