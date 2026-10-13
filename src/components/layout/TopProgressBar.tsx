'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';
import { cn } from '@/lib/cn';
import { progress } from '@/lib/progress';

/** Is this click an in-app navigation to a different page? */
function navigationTarget(event: MouseEvent): boolean {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }
  const anchor = (event.target as Element | null)?.closest?.('a[href]');
  if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank' || anchor.hasAttribute('download')) return false;
  const url = new URL(anchor.href, window.location.href);
  return url.origin === window.location.origin && url.pathname + url.search !== window.location.pathname + window.location.search;
}

/**
 * Thin bar at the very top of the page that runs left to right while a page
 * navigation or API request is in progress.
 */
export function TopProgressBar() {
  const { phase, run } = useSyncExternalStore(progress.subscribe, progress.getSnapshot, progress.getServerSnapshot);
  const pathname = usePathname();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (navigationTarget(event)) progress.startNavigation();
    };
    // Capture phase: runs before next/link calls preventDefault() on the click.
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // A new pathname means the navigation finished.
  useEffect(() => {
    progress.endNavigation();
  }, [pathname]);

  if (phase === 'idle') return null;

  return (
    <div
      role="progressbar"
      aria-label="Loading"
      aria-busy={phase === 'loading'}
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]"
    >
      <div
        key={run}
        className={cn(
          'h-full rounded-r-full bg-indigo-600 shadow-[0_0_10px_var(--color-indigo-400)]',
          phase === 'loading' ? 'animate-progress' : 'w-full opacity-0 transition-opacity delay-150 duration-300'
        )}
      />
    </div>
  );
}
