'use client';

import { ProfileSelectorProps } from '@/components/controls/ProfileSelector/ProfileSelector.types';
import { PROFILE_LABELS } from '@/components/controls/ProfileSelector/ProfileSelector.constants';
import { ChevronDown } from 'lucide-react';

export function ProfileSelector({ active, onChange, profiles }: ProfileSelectorProps) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={active}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none text-xs font-semibold pl-3 pr-8 py-1.5 border rounded-lg bg-card text-foreground cursor-pointer hover:bg-accent"
      >
        {profiles.map((p) => (
          <option key={p} value={p}>
            {PROFILE_LABELS[p] || p}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 h-3 w-3 pointer-events-none text-muted-foreground" />
    </div>
  );
}
