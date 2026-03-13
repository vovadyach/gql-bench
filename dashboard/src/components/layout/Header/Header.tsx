import { HeaderProps } from '@/components/layout/Header/Header.types';
import { Logo } from '@/components/shared/Logo/Logo';
import { MethodologyDrawer } from '@/components/layout/MethodologyDrawer/MethodologyDrawer';
import { ThemeToggle } from '@/components/shared/ThemeToggle/ThemeToggle';

export function Header({ meta }: HeaderProps) {
  return (
    <header className="flex items-center justify-between flex-wrap gap-3 mb-7">
      <div className="flex items-center gap-3">
        <Logo size={40} />
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
        <MethodologyDrawer meta={meta} />
        <ThemeToggle />
      </div>
    </header>
  );
}
