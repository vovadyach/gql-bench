import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center border rounded-lg hover:bg-accent transition-colors text-base"
    >
      <Sun className="hidden dark:block h-4 w-4" />
      <Moon className="block dark:hidden h-4 w-4" />
    </button>
  );
}
