import { KeyFindingsProps } from '@/components/sections/KeyFindings/KeyFindings.types';

export function KeyFindings({ findings }: KeyFindingsProps) {
  return (
    <div className="mb-8">
      <h2 className="text-sm font-bold mb-4">Key Findings</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {findings.map((f, i) => (
          <div
            key={i}
            className="rounded-xl border p-4 bg-card"
            style={{ borderLeftWidth: 2, borderLeftColor: f.color }}
          >
            <f.icon className="h-5 w-5" />
            {/*<span className="text-base">{f.icon}</span>*/}
            <p className="text-sm font-bold mt-2">{f.title}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
