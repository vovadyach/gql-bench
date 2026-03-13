import { LogoProps } from '@/components/shared/Logo/Logo.types';

export function Logo({ dark = true, size = 40 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="logo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff4757" />
          <stop offset="100%" stopColor="#00b0ff" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="6" fill="url(#logo-bg)" />
      <path d="M18.5 5L10.5 17h5L13.5 27l10-13.5h-5.5L18.5 5z" fill={dark ? 'white' : '#0a0b12'} />
    </svg>
  );
}
