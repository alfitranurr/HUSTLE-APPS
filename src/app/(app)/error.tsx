'use client';

import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <EmptyState
      className="mt-10"
      icon={<AlertTriangle className="size-5 text-rose-500" />}
      title="Something went wrong"
      description="This page failed to load. Try again, and if it keeps happening check your connection."
      action={
        <Button variant="secondary" icon={<RotateCw className="size-4" />} onClick={reset}>
          Try again
        </Button>
      }
    />
  );
}
