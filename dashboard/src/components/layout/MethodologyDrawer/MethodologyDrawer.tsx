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
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground">What is being compared?</p>
            <p>
              Every setup serves the same GraphQL schema and queries. NestJS setups use framework
              integrations; direct setups use the GraphQL server without NestJS.
            </p>
            <p>
              Express and Fastify provide HTTP routing. Apollo Server, Yoga, and Mercurius handle
              GraphQL. Standalone Yoga connects directly to Node.js HTTP, without Express, Fastify,
              or Apollo Server.
            </p>
            <p>
              Python, C#, Go, and Java serve the same schema, data, and delays, and are compared
              with the fastest Node.js server. Every server is one process on one thread; by default
              .NET, Go, and Java would use all cores, so this compares speed per core.
            </p>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground">Reading the results</p>
            <p>
              Quick (10 users) results depend partly on how precisely the operating system fires the
              simulated 1–3 ms database delays. All servers in a profile were measured under the
              same conditions.
            </p>
            <p>
              Deep Nested also runs a CPU loop of sin/cos math, which .NET runs faster than Node.js.
              That is part of the C# lead on that test.
            </p>
          </div>
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
              {[
                meta.tool,
                meta.node_version,
                meta.python_version && `Python ${meta.python_version}`,
                meta.dotnet_version && `.NET ${meta.dotnet_version}`,
                meta.go_version && `Go ${meta.go_version}`,
                meta.java_version && `Java ${meta.java_version}`,
                `${meta.platform}/${meta.arch}`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <p className="text-sm font-semibold text-foreground mt-4">Profile</p>
            <p className="text-sm text-muted-foreground">{meta.profile}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
