'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { errorMessage } from '@/lib/api';
import type { CandidateProfile, ProfileInput } from '@/lib/types';
import { saveProfile } from './matchApi';

type ListKey = 'targetRoles' | 'preferredLocations' | 'skills' | 'keywords' | 'excludeKeywords' | 'titles';

const LISTS: { key: ListKey; label: string; hint: string; rows: number }[] = [
  { key: 'targetRoles', label: 'Target roles', hint: 'Weighs most. e.g. Data Analyst, Business Intelligence Analyst', rows: 2 },
  { key: 'preferredLocations', label: 'Preferred locations', hint: 'e.g. Jakarta, Tangerang, Remote', rows: 2 },
  { key: 'skills', label: 'Skills', hint: 'Matched against job titles', rows: 3 },
  { key: 'keywords', label: 'Extra keywords', hint: 'Domains or tools that count as a match, e.g. fintech, banking', rows: 2 },
  { key: 'excludeKeywords', label: 'Never show', hint: 'Any of these in a title or company sets the score to 0, e.g. Sales, Telemarketing', rows: 2 },
  { key: 'titles', label: 'Past roles', hint: 'Read from your PDF; count a little less than target roles', rows: 2 },
];

const toText = (items: string[]) => items.join(', ');
const toList = (text: string) =>
  text
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

export function ProfileModal({ profile, onClose, onSaved }: { profile: CandidateProfile; onClose: () => void; onSaved: (p: CandidateProfile) => void }) {
  const toast = useToast();
  const [headline, setHeadline] = useState(profile.headline);
  const [location, setLocation] = useState(profile.location);
  const [years, setYears] = useState(profile.yearsExperience === null ? '' : String(profile.yearsExperience));
  const [lists, setLists] = useState<Record<ListKey, string>>(
    () => Object.fromEntries(LISTS.map(({ key }) => [key, toText(profile[key])])) as Record<ListKey, string>
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const yearsNumber = Number.parseFloat(years);
    const input: ProfileInput = {
      name: profile.name,
      headline: headline.trim(),
      location: location.trim(),
      education: profile.education,
      yearsExperience: years.trim() && Number.isFinite(yearsNumber) ? Math.max(0, Math.min(60, yearsNumber)) : null,
      ...(Object.fromEntries(LISTS.map(({ key }) => [key, toList(lists[key])])) as Record<ListKey, string[]>),
    };
    setSaving(true);
    try {
      const saved = await saveProfile(input);
      toast.success('Profile saved. Scores updated.');
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      accent="violet"
      dismissible={!saving}
      title="Edit profile"
      description="Separate items with commas. Scores update as soon as you save."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="profile-form" loading={saving}>
            Save profile
          </Button>
        </>
      }
    >
      <form id="profile-form" onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr_8rem]">
          <Field label="Headline">
            <Input value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </Field>
          <Field label="Location">
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </Field>
          <Field label="Years of experience" hint="Used for the level fit">
            <Input type="number" min={0} max={60} step={0.1} value={years} onChange={(e) => setYears(e.target.value)} />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {LISTS.map(({ key, label, hint, rows }) => (
            <Field key={key} label={label} hint={hint}>
              <Textarea rows={rows} value={lists[key]} onChange={(e) => setLists((l) => ({ ...l, [key]: e.target.value }))} />
            </Field>
          ))}
        </div>
      </form>
    </Modal>
  );
}
