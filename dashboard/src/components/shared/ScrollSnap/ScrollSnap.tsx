import { cn } from '@/lib/utils';
import { ScrollSnapProps } from '@/components/shared/ScrollSnap/ScrollSnap.types';

export function ScrollSnap({ children, className }: ScrollSnapProps) {
  return (
    <div className="relative">
      <div className="absolute left-0 top-0 bottom-2 w-4 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none sm:hidden" />
      <div className="absolute right-0 top-0 bottom-2 w-4 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none sm:hidden" />
      <div
        className={cn(
          'flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory',
          'sm:overflow-visible sm:flex-wrap sm:pb-0 sm:snap-none',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
