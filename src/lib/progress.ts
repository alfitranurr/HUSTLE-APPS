/**
 * Global activity store for the top progress bar. Anything that takes time
 * (API requests, page navigations) calls start()/done(); the bar shows while
 * at least one is pending.
 */

export type ProgressPhase = 'idle' | 'loading' | 'finishing';

export interface ProgressState {
  phase: ProgressPhase;
  /** Increments for every new loading run, so the bar restarts from the left. */
  run: number;
}

const FINISH_MS = 400;
const NAVIGATION_TIMEOUT_MS = 10_000;

let state: ProgressState = { phase: 'idle', run: 0 };
let pending = 0;
let navigating = false;
let finishTimer: ReturnType<typeof setTimeout> | undefined;
let navigationTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function update() {
  const busy = pending > 0 || navigating;
  if (busy && state.phase !== 'loading') {
    clearTimeout(finishTimer);
    state = { phase: 'loading', run: state.run + 1 };
    emit();
  } else if (!busy && state.phase === 'loading') {
    state = { ...state, phase: 'finishing' };
    emit();
    finishTimer = setTimeout(() => {
      state = { ...state, phase: 'idle' };
      emit();
    }, FINISH_MS);
  }
}

export const progress = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => state,
  getServerSnapshot: () => state,

  start() {
    pending += 1;
    update();
  },
  done() {
    pending = Math.max(0, pending - 1);
    update();
  },

  startNavigation() {
    navigating = true;
    clearTimeout(navigationTimer);
    // Safety net in case the route never changes (e.g. navigation aborted).
    navigationTimer = setTimeout(() => progress.endNavigation(), NAVIGATION_TIMEOUT_MS);
    update();
  },
  endNavigation() {
    if (!navigating) return;
    navigating = false;
    clearTimeout(navigationTimer);
    update();
  },
};

/** Shows the progress bar for the lifetime of a promise. */
export async function trackProgress<T>(promise: Promise<T>): Promise<T> {
  progress.start();
  try {
    return await promise;
  } finally {
    progress.done();
  }
}
