'use client';

import { Menu } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { IconButton } from '@/components/ui/Button';
import { useJobs } from '@/hooks/useJobs';
import { cn } from '@/lib/cn';
import { Brand, Sidebar } from './Sidebar';
import { SplashScreen } from './SplashScreen';

export function AppShell({ ownerName, children }: { ownerName: string; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Warm the shared applications cache once; until it arrives, show the splash.
  const { hasData, error } = useJobs();
  const booting = !hasData && !error;

  return (
    <div className="min-h-dvh bg-white">
      {booting && <SplashScreen />}
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
        <div className="flex h-14 items-center justify-between px-4">
          <Brand />
          <IconButton label="Open menu" icon={<Menu className="size-5" />} onClick={() => setMobileOpen(true)} />
        </div>
      </header>

      <div className={cn('transition-[padding] duration-200', collapsed ? 'md:pl-[4.5rem]' : 'md:pl-52')}>
        <main id="main" className="mx-auto w-full max-w-[137.5rem] px-4 py-6 sm:px-6 lg:py-8 2xl:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
