import { NextResponse } from 'next/server';
import { NotFoundError } from '@/lib/server/db';
import { withAuth } from '@/lib/server/http';
import { signedAttachmentUrl } from '@/lib/server/proofs';

type Ctx = { params: Promise<{ id: string }> };

/**
 * Opens a proof file: a fresh signed URL (60 s) made with the user's own client,
 * so storage RLS decides. Links in the UI stay valid however long a tab is open.
 */
export const GET = withAuth<Ctx>(async (_req, { params }, data) => {
  const { id } = await params;
  const url = await signedAttachmentUrl(data, id);
  if (!url) throw new NotFoundError('File not found');
  return NextResponse.redirect(url, { headers: { 'Cache-Control': 'private, no-store' } });
});
