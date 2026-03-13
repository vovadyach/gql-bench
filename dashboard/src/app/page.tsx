'use client';

import { useState } from 'react';
import BENCHMARK_DATA from '@/lib/data.json';
import { Header } from '@/components/layout/Header/Header';

export default function Page() {
  const [dark, setDark] = useState(true);
  const [showMethod, setShowMethod] = useState(false);

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-background text-foreground p-6">
        <Header
          meta={BENCHMARK_DATA.meta}
          dark={dark}
          onThemeToggle={() => setDark(!dark)}
          showMethodology={showMethod}
          onMethodologyToggle={() => setShowMethod(!showMethod)}
        />
        {showMethod && (
          <div className="p-4 border rounded-lg mb-4">
            <p className="text-sm font-bold text-blue-400 mb-2">Methodology</p>
            {BENCHMARK_DATA.meta.methodology.map((m, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                → {m}
              </p>
            ))}
          </div>
        )}
        <p className="text-muted-foreground">Rest of dashboard goes here...</p>
      </div>
    </div>
  );
}
