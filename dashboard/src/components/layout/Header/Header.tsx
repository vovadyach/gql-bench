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
            Same GraphQL schema and queries across server stacks.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground px-2.5 py-1 border rounded-md">
          {meta.cpu_model} · {meta.cpus} cores
        </span>
        <MethodologyDrawer meta={meta} />
        <div className="shrink-0">
          <ThemeToggle />
        </div>
      </div>
      {/* basis-full keeps the description on its own row, so it never sits beside the buttons */}
      <div className="basis-full">
        <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
          Compare NestJS with direct integrations (without NestJS). Express and Fastify host the
          GraphQL endpoint; standalone Yoga runs directly on Node.js HTTP.
        </p>
      </div>
    </header>
  );
}
