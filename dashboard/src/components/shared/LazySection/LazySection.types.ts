import { ReactNode } from 'react';

export interface LazySectionProps {
  children: ReactNode;
  height?: string;
  skeleton?: ReactNode;
}
