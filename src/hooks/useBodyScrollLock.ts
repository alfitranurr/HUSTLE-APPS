import { useEffect } from 'react';

let locks = 0;

/** Prevents the page behind an open overlay from scrolling. Safe with nested overlays. */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    locks += 1;
    document.body.style.overflow = 'hidden';
    return () => {
      locks -= 1;
      if (locks === 0) document.body.style.overflow = '';
    };
  }, [active]);
}
