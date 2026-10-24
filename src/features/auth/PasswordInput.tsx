'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState, type ComponentProps } from 'react';
import { Field, Input } from '@/components/ui/Field';

export function PasswordInput({ label, hint, ...props }: ComponentProps<typeof Input> & { label: string; hint?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <Field label={label} hint={hint}>
        <Input type={visible ? 'text' : 'password'} required {...props} />
      </Field>
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="mt-1.5 inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
      >
        {visible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        {visible ? 'Hide password' : 'Show password'}
      </button>
    </div>
  );
}
