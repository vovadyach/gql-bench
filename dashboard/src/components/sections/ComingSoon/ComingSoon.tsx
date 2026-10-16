import { COMING_SOON } from '@/lib/constants';

// `released`: languages that already have results, so they're no longer "coming soon"
export function ComingSoon({ released = [] }: { released?: string[] }) {
  const upcoming = COMING_SOON.filter((lang) => !released.includes(lang.lang));
  if (!upcoming.length) return null;

  return (
    <div className="mb-8">
      <div className="border border-dashed rounded-xl p-6 text-center">
        <p className="text-sm font-bold mb-4">Coming Soon</p>
        <div className="flex justify-center gap-3 flex-wrap">
          {upcoming.map((lang) => (
            <div
              key={lang.lang}
              className="px-4 py-2 rounded-lg border"
              style={{
                borderColor: `${lang.color}30`,
                backgroundColor: `${lang.color}08`,
              }}
            >
              <p className="text-sm font-bold" style={{ color: lang.color }}>
                {lang.lang}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{lang.frameworks}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
