/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  allowedDevOrigins: [
    '9f73a528-7d23-48b3-b0f0-5361465380d6-00-18ub8blylv2ys.worf.replit.dev',
    '*.worf.replit.dev',
    '*.replit.dev',
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      console.log('Configuring rewrites with backendUrl:', backendUrl);
      return [
        {
          source: '/api/auth/api-keys/:path*',
          destination: `${backendUrl}/api/auth/api-keys/:path*`,
        },
        {
          source: '/api/auth/api-keys',
          destination: `${backendUrl}/api/auth/api-keys`,
        },
        {
          source: '/api/auth/me',
          destination: `${backendUrl}/api/auth/me`,
        },
        {
          source: '/api/auth/profile',
          destination: `${backendUrl}/api/auth/profile`,
        },
      ];
  },
  transpilePackages: [
    '@sonate/core',
    '@sonate/detect',
    '@sonate/lab',
    '@sonate/orchestrate',
    '@sonate/persistence'
  ],
  experimental: {
    // This is needed to handle some node modules in newer Next.js versions
    serverComponentsExternalPackages: ['@noble/hashes'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        os: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      'node:crypto': 'crypto',
      'node:fs': 'fs',
      'node:path': 'path',
      'node:perf_hooks': 'perf_hooks',
    };
    return config;
  },
};

export default nextConfig;
