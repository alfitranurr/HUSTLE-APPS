'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { apiFetch, errorMessage, jsonRequest } from '@/lib/api';

interface AccountModalProps {
  open: boolean;
  account: { displayName: string; email: string; isAdmin: boolean };
  onClose: () => void;
}

export function AccountModal({ open, account, onClose }: AccountModalProps) {
  const router = useRouter();
  const toast = useToast();
  const [confirmEmail, setConfirmEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const matches = confirmEmail.trim().toLowerCase() === account.email.toLowerCase();

  const close = () => {
    setConfirmEmail('');
    onClose();
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await apiFetch('/api/account', { ...jsonRequest('POST', { confirmEmail }), method: 'DELETE' });
      router.replace('/login');
      router.refresh();
    } catch (error) {
      toast.error(errorMessage(error));
      setDeleting(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Account" size="sm" dismissible={!deleting}>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-slate-500">Name</dt>
          <dd className="font-semibold text-slate-900">{account.displayName}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Email</dt>
          <dd className="font-semibold break-all text-slate-900">{account.email}</dd>
        </div>
      </dl>

      <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50/50 p-4">
        <h3 className="text-sm font-semibold text-rose-800">Delete account</h3>
        {account.isAdmin ? (
          <p className="mt-1 text-sm text-slate-600">The admin account can&apos;t be deleted from the app.</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-slate-600">
              Permanently deletes your applications, interview prep, proof files, API tokens and this account. This
              can&apos;t be undone.
            </p>
            <Field label="Type your email to confirm" className="mt-3">
              <Input
                type="email"
                autoComplete="off"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                disabled={deleting}
                placeholder={account.email}
              />
            </Field>
            <Button
              variant="danger"
              className="mt-3 w-full"
              icon={<Trash2 className="size-4" />}
              disabled={!matches}
              loading={deleting}
              onClick={deleteAccount}
            >
              Delete my account
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
