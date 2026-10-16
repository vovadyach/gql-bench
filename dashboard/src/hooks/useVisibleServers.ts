import { useState } from 'react';
import { SERVER_KEYS } from '@/lib/constants';
import { isNodeServer } from '@/lib/utils';

// Node servers start visible; other languages are opt-in, so the default view stays Node-only
export const DEFAULT_VISIBLE = SERVER_KEYS.filter((k) => isNodeServer(k));

export function useVisibleServers() {
  const [visible, setVisible] = useState<string[]>(DEFAULT_VISIBLE);

  const toggle = (key: string) => {
    setVisible((v) =>
      v.includes(key) ? (v.length > 1 ? v.filter((x) => x !== key) : v) : [...v, key],
    );
  };

  // Show a whole tier, or hide it when it's fully shown (never hides everything)
  const toggleTier = (keys: string[]) => {
    setVisible((v) => {
      if (!keys.every((k) => v.includes(k))) return [...v, ...keys.filter((k) => !v.includes(k))];
      const rest = v.filter((k) => !keys.includes(k));
      return rest.length ? rest : v;
    });
  };

  return { visible, toggle, toggleTier };
}
