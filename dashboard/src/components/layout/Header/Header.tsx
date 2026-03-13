import { HeaderProps } from '@/components/layout/Header/Header.types';
import { Logo } from '@/components/shared/Logo/Logo';

export function Header({
  meta,
  dark,
  showMethodology,
  onMethodologyToggle,
  onThemeToggle,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between flex-wrap gap-3 mb-7">
      <div className="flex items-center gap-3">
        <Logo dark={dark} size={40} />
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">
            GraphQL <span className="text-[#ff4757]">Bench</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            NestJS — Express vs Fastify vs Mercurius
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground px-2.5 py-1 border rounded-md">
          {meta.cpu_model} · {meta.cpus} cores
        </span>
        <button
          onClick={onMethodologyToggle}
          className="px-3 py-1.5 text-xs font-semibold text-muted-foreground border rounded-md hover:bg-accent transition-colors"
        >
          {showMethodology ? '✕ Close' : '◎ Method'}
        </button>
        <button
          onClick={onThemeToggle}
          className="w-9 h-9 flex items-center justify-center border rounded-lg hover:bg-accent transition-colors text-base"
        >
          {dark ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}
