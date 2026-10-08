import { Dashboard } from '@/app/Dashboard';

export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground py-8 overflow-x-hidden">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <Dashboard />
      </div>
    </div>
  );
}
