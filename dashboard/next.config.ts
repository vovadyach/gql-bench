import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['recharts', 'lucide-react'],
  },
};

export default nextConfig;
