import { MethodologyDrawerProps } from '@/components/layout/MethodologyDrawer/MethodologyDrawer.types';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function MethodologyDrawer({ meta }: MethodologyDrawerProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="px-3 py-1.5 text-xs font-semibold text-muted-foreground border rounded-md hover:bg-accent transition-colors">
          ◎ Methodology
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[360px] h-dvh overflow-y-auto p-8">
        <SheetHeader>
          <SheetTitle className="text-lg font-bold">Benchmark Methodology</SheetTitle>
          <SheetDescription>Benchmark setup, environment, and machine details.</SheetDescription>
        </SheetHeader>
        <div className=" space-y-6">
          {meta.methodology.map((m, i) => (
            <div key={i} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
              <span className="text-blue-400 shrink-0">→</span>
              <span>{m}</span>
            </div>
          ))}
          <div className="pt-6 mt-6 border-t space-y-2">
            <p className="text-sm font-semibold text-foreground">Machine</p>
            <p className="text-sm text-muted-foreground">
              {meta.cpu_model} · {meta.cpus} cores · {meta.memory_gb}GB
            </p>
            <p className="text-sm font-semibold text-foreground mt-4">Environment</p>
            <p className="text-sm text-muted-foreground">
              {meta.tool} · {meta.node_version} · {meta.platform}/{meta.arch}
            </p>
            <p className="text-sm font-semibold text-foreground mt-4">Profile</p>
            <p className="text-sm text-muted-foreground">{meta.profile}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
