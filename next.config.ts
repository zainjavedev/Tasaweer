import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Use the default Node runtime to enable route handlers/server actions.
  // For production, build with `output: 'standalone'` on platforms like Docker.
  typescript: {
    // Allow building even if type errors exist during initial migration
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
