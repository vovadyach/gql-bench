import { Dashboard } from '@/app/Dashboard';

export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground py-8 overflow-x-hidden">
      <div className="mx-auto w-full max-w-[1240px] px-3 sm:px-5 lg:px-6">
        <Dashboard />
      </div>
    </div>
  );
}
