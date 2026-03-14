'use client';

import { COMPLEXITY_COLORS } from '@/lib/constants';
import type { ScenarioPickerProps } from './ScenarioPicker.types';
import { ScrollSnap } from '@/components/shared/ScrollSnap/ScrollSnap';

export function ScenarioPicker({ scenarios, active, onChange }: ScenarioPickerProps) {
  return (
    <ScrollSnap className="flex gap-2 mb-4">
      {scenarios.map((s, i) => {
        const isActive = i === active;
        const color = COMPLEXITY_COLORS[s.complexity];
        const colorVar = `var(--complexity-${s.complexity})`;

        return (
          <button
            key={s.id}
            onClick={() => onChange(i)}
            className="shrink-0 snap-start whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold cursor-pointer"
            style={{
              borderColor: isActive ? color : 'var(--border)',
              backgroundColor: isActive
                ? `color-mix(in srgb, ${colorVar} 10%, transparent)`
                : 'transparent',
              color: isActive ? colorVar : 'var(--muted-foreground)',
              opacity: isActive ? 1 : 0.6,
            }}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                backgroundColor: color,
                boxShadow: isActive ? `0 0 6px ${color}` : 'none',
              }}
            />
            {s.name}
            <span className="text-xs opacity-50">[{s.complexity}]</span>
          </button>
        );
      })}
    </ScrollSnap>
  );
}
