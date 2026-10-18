'use client';

import { FileUp, Pencil, UserRound } from 'lucide-react';
import { useRef, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { errorMessage } from '@/lib/api';
import { formatRelative } from '@/lib/format';
import type { Tone } from '@/lib/tones';
import type { CandidateProfile } from '@/lib/types';
import { uploadProfilePdf } from './matchApi';

const SKILLS_SHOWN = 14;

function ChipRow({ label, items, tone, empty }: { label: string; items: string[]; tone: Tone; empty: string }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-slate-500">{label}</p>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <Badge key={item} tone={tone}>
              {item}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

interface ProfileCardProps {
  profile: CandidateProfile | null;
  loading: boolean;
  onEdit: () => void;
  onUploaded: (profile: CandidateProfile) => void;
}

/** The profile the scores are measured against: from LinkedIn's "Save to PDF", then edited. */
export function ProfileCard({ profile, loading, onEdit, onUploaded }: ProfileCardProps) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const saved = await uploadProfilePdf(file);
      toast.success(`Profile read: ${saved.skills.length} skills, ${saved.titles.length} roles.`);
      onUploaded(saved);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setUploading(false);
      if (input.current) input.current.value = '';
    }
  };

  const picker = (
    <input
      ref={input}
      type="file"
      accept="application/pdf,.pdf"
      className="sr-only"
      aria-label="LinkedIn profile PDF"
      onChange={(e) => void upload(e.target.files?.[0])}
    />
  );

  if (loading) return <Skeleton className="h-56" />;

  if (!profile) {
    return (
      <Card accent="violet" className="h-full">
        <CardHeader title="Your profile" description="Scores compare each job with your LinkedIn profile" icon={<UserRound className="mt-0.5 size-4 text-violet-500" />} />
        <CardContent className="space-y-4">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
            <li>Open your LinkedIn profile.</li>
            <li>
              Click <strong className="font-semibold text-slate-800">More → Save to PDF</strong>.
            </li>
            <li>Upload that PDF here. Your skills, roles and location are read from it; you can edit them after.</li>
          </ol>
          {picker}
          <Button icon={<FileUp className="size-4" />} loading={uploading} onClick={() => input.current?.click()}>
            Upload profile PDF
          </Button>
        </CardContent>
      </Card>
    );
  }

  const extraSkills = profile.skills.length - SKILLS_SHOWN;
  return (
    <Card accent="violet" className="h-full">
      <CardHeader
        title={profile.name || 'Your profile'}
        description={
          <>
            {profile.headline || 'No headline'}
            {profile.parsedAt && <> · PDF read {formatRelative(profile.parsedAt)}</>}
          </>
        }
        icon={<UserRound className="mt-0.5 size-4 text-violet-500" />}
        action={
          <div className="flex gap-1.5">
            {picker}
            <Button variant="ghost" size="sm" icon={<FileUp className="size-3.5" />} loading={uploading} onClick={() => input.current?.click()}>
              New PDF
            </Button>
            <Button variant="secondary" size="sm" icon={<Pencil className="size-3.5" />} onClick={onEdit}>
              Edit
            </Button>
          </div>
        }
      />
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <ChipRow label="Looking for" items={profile.targetRoles} tone="violet" empty="Add target roles in Edit" />
        <ChipRow label="Locations" items={profile.preferredLocations} tone="sky" empty="Any location" />
        <div className="sm:col-span-2">
          <ChipRow
            label={`Skills${profile.yearsExperience !== null ? ` · about ${profile.yearsExperience} years of experience` : ''}`}
            items={extraSkills > 0 ? [...profile.skills.slice(0, SKILLS_SHOWN), `+${extraSkills} more`] : profile.skills}
            tone="slate"
            empty="No skills yet"
          />
        </div>
        {profile.excludeKeywords.length > 0 && (
          <div className="sm:col-span-2">
            <ChipRow label="Never show" items={profile.excludeKeywords} tone="rose" empty="" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
