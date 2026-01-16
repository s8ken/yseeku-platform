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
  async headers() {
    return [
      {
        source: '/(.*)\.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ]
      },
      {
        source: '/(.*)\.(css|svg|ico|png|jpg|jpeg|gif|woff|woff2)'
        , headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ]
      }
    ];
  },
  async rewrites() {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'https://thriving-vitality.up.railway.app';
      console.log('Configuring rewrites with backendUrl:', backendUrl);
      const rules = [
        {
          source: '/api/agents/:path*',
          destination: `${backendUrl}/api/agents/:path*`,
        },
        {
          source: '/api/agents',
          destination: `${backendUrl}/api/agents`,
        },
        {
          source: '/api/llm/:path*',
          destination: `${backendUrl}/api/llm/:path*`,
        },
        {
          source: '/api/trust/:path*',
          destination: `${backendUrl}/api/trust/:path*`,
        },
        {
          source: '/api/dashboard/:path*',
          destination: `${backendUrl}/api/dashboard/:path*`,
        },
        {
          source: '/api/overseer/:path*',
          destination: `${backendUrl}/api/overseer/:path*`,
        },
        {
          source: '/api/lab/:path*',
          destination: `${backendUrl}/api/lab/:path*`,
        },
        {
          source: '/api/demo/:path*',
          destination: `${backendUrl}/api/demo/:path*`,
        },
        {
          source: '/api/risk-events/:path*',
          destination: `${backendUrl}/api/risk-events/:path*`,
        },
        {
          source: '/api/audit/:path*',
          destination: `${backendUrl}/api/audit/:path*`,
        },
        {
          source: '/api/tenants/:path*',
          destination: `${backendUrl}/api/tenants/:path*`,
        },
        {
          source: '/api/secrets/:path*',
          destination: `${backendUrl}/api/secrets/:path*`,
        },
        {
          source: '/api/gateway/:path*',
          destination: `${backendUrl}/api/gateway/:path*`,
        },
        {
          source: '/api/overrides/:path*',
          destination: `${backendUrl}/api/overrides/:path*`,
        },
        {
          source: '/api/did/:path*',
          destination: `${backendUrl}/api/did/:path*`,
        },
        {
          source: '/api/conversations/:path*',
          destination: `${backendUrl}/api/conversations/:path*`,
        },
      ];

      // IMPORTANT: Do not rewrite /api/auth/* so local Next.js API routes can proxy
      // This avoids browser CORS and guarantees login works across envs

      return rules;
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
    serverComponentsExternalPackages: [
      '@noble/hashes',
      '@noble/ed25519',
      '@noble/secp256k1',
      'bcrypt',
      'bcryptjs',
      'jsonwebtoken',
      'prom-client',
      'winston'
    ],
    optimizePackageImports: [
      'react',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-dialog'
    ]
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
