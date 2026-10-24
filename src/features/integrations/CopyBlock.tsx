'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

/** Read-only text with a copy button (token, commands, JSON config). */
export function CopyBlock({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy failed. Select the text and copy it by hand.');
    }
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <Button
          size="sm"
          variant="secondary"
          icon={copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
          onClick={copy}
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <pre
        className={
          'max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 text-xs leading-relaxed whitespace-pre-wrap text-slate-100 ' +
          (mono ? 'font-mono break-all' : '')
        }
      >
        {value}
      </pre>
    </div>
  );
}
