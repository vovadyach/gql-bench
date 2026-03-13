import { useState } from 'react';
import { SERVER_KEYS } from '@/lib/constants';

export function useVisibleServers() {
  const [visible, setVisible] = useState<string[]>(SERVER_KEYS);

  const toggle = (key: string) => {
    setVisible((v) =>
      v.includes(key) ? (v.length > 1 ? v.filter((x) => x !== key) : v) : [...v, key],
    );
  };

  return { visible, toggle };
}
