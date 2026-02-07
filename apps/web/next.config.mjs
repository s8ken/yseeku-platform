/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable source maps in production to reduce memory usage during build
  productionBrowserSourceMaps: false,
  
  allowedDevOrigins: [
    '9f73a528-7d23-48b3-b0f0-5361465380d6-00-18ub8blylv2ys.worf.replit.dev',
    '*.worf.replit.dev',
    '*.replit.dev',
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  async headers() {
    return [
      {
        source: '/(.*)\\.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ]
      },
      {
        source: '/(.*)\\.(css|svg|ico|png|jpg|jpeg|gif|woff|woff2)'
        , headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ]
      }
    ];
  },
  async rewrites() {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:3001';
      console.log('Configuring rewrites with backendUrl:', backendUrl);
      return [
        // Auth
        {
          source: '/api/auth/:path*',
          destination: `${backendUrl}/api/auth/:path*`,
        },
        // Agents
        {
          source: '/api/agents/:path*',
          destination: `${backendUrl}/api/agents/:path*`,
        },
        {
          source: '/api/agents',
          destination: `${backendUrl}/api/agents`,
        },
        // LLM
        {
          source: '/api/llm/:path*',
          destination: `${backendUrl}/api/llm/:path*`,
        },
        // Trust
        {
          source: '/api/trust/:path*',
          destination: `${backendUrl}/api/trust/:path*`,
        },
        // Dashboard (KPIs, alerts, risk, policy-status)
        {
          source: '/api/dashboard/:path*',
          destination: `${backendUrl}/api/dashboard/:path*`,
        },
        // Overseer / System Brain
        {
          source: '/api/overseer/:path*',
          destination: `${backendUrl}/api/overseer/:path*`,
        },
        {
          source: '/api/orchestrator/:path*',
          destination: `${backendUrl}/api/overseer/:path*`,
        },
        // Lab
        {
          source: '/api/lab/:path*',
          destination: `${backendUrl}/api/lab/:path*`,
        },
        // Demo
        {
          source: '/api/demo/:path*',
          destination: `${backendUrl}/api/demo/:path*`,
        },
        // Risk Events
        {
          source: '/api/risk-events/:path*',
          destination: `${backendUrl}/api/risk-events/:path*`,
        },
        // Audit
        {
          source: '/api/audit/:path*',
          destination: `${backendUrl}/api/audit/:path*`,
        },
        // Tenants
        {
          source: '/api/tenants/:path*',
          destination: `${backendUrl}/api/tenants/:path*`,
        },
        {
          source: '/api/tenants',
          destination: `${backendUrl}/api/tenants`,
        },
        // Secrets
        {
          source: '/api/secrets/:path*',
          destination: `${backendUrl}/api/secrets/:path*`,
        },
        // API Gateway
        {
          source: '/api/gateway/:path*',
          destination: `${backendUrl}/api/gateway/:path*`,
        },
        // Overrides
        {
          source: '/api/overrides/:path*',
          destination: `${backendUrl}/api/overrides/:path*`,
        },
        // DID
        {
          source: '/api/did/:path*',
          destination: `${backendUrl}/api/did/:path*`,
        },
        // Conversations
        {
          source: '/api/conversations/:path*',
          destination: `${backendUrl}/api/conversations/:path*`,
        },
        {
          source: '/api/conversations',
          destination: `${backendUrl}/api/conversations`,
        },
        // Semantic Coprocessor
        {
          source: '/api/semantic-coprocessor/:path*',
          destination: `${backendUrl}/api/semantic-coprocessor/:path*`,
        },
        // Actions
        {
          source: '/api/actions/:path*',
          destination: `${backendUrl}/api/actions/:path*`,
        },
        // === PREVIOUSLY MISSING REWRITES ===
        // Drift Detection
        {
          source: '/api/drift/:path*',
          destination: `${backendUrl}/api/drift/:path*`,
        },
        // Emergence Detection
        {
          source: '/api/emergence/:path*',
          destination: `${backendUrl}/api/emergence/:path*`,
        },
        // Insights
        {
          source: '/api/insights/:path*',
          destination: `${backendUrl}/api/insights/:path*`,
        },
        {
          source: '/api/insights',
          destination: `${backendUrl}/api/insights`,
        },
        // Interactions
        {
          source: '/api/interactions/:path*',
          destination: `${backendUrl}/api/interactions/:path*`,
        },
        {
          source: '/api/interactions',
          destination: `${backendUrl}/api/interactions`,
        },
        // Live Metrics
        {
          source: '/api/live/:path*',
          destination: `${backendUrl}/api/live/:path*`,
        },
        // Orchestrate (Multi-Agent)
        {
          source: '/api/orchestrate/:path*',
          destination: `${backendUrl}/api/orchestrate/:path*`,
        },
        // Phase-Shift Velocity
        {
          source: '/api/phase-shift/:path*',
          destination: `${backendUrl}/api/phase-shift/:path*`,
        },
        // Proof (public widget)
        {
          source: '/api/proof/:path*',
          destination: `${backendUrl}/api/proof/:path*`,
        },
        // Reports
        {
          source: '/api/reports/:path*',
          destination: `${backendUrl}/api/reports/:path*`,
        },
        // Safeguards
        {
          source: '/api/safeguards/:path*',
          destination: `${backendUrl}/api/safeguards/:path*`,
        },
        // Safety (Prompt Scanning)
        {
          source: '/api/safety/:path*',
          destination: `${backendUrl}/api/safety/:path*`,
        },
        // Webhooks
        {
          source: '/api/webhooks/:path*',
          destination: `${backendUrl}/api/webhooks/:path*`,
        },
        // Compare (Multi-Model)
        {
          source: '/api/compare/:path*',
          destination: `${backendUrl}/api/compare/:path*`,
        },
        // Consent
        {
          source: '/api/consent/:path*',
          destination: `${backendUrl}/api/consent/:path*`,
        },
        // Evaluation Method
        {
          source: '/api/evaluation-method/:path*',
          destination: `${backendUrl}/api/evaluation-method/:path*`,
        },
        // Monitoring / Metrics / Health
        {
          source: '/api/metrics',
          destination: `${backendUrl}/api/metrics`,
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
  serverExternalPackages: [
    '@noble/hashes',
    '@noble/ed25519',
    '@noble/secp256k1',
    'bcrypt',
    'bcryptjs',
    'jsonwebtoken',
    'prom-client',
    'winston'
  ],
  experimental: {
    optimizePackageImports: [
      'react',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-dialog'
    ]
  },
  // webpack: (config, { isServer }) => {
  //   if (!isServer) {
  //     config.resolve.fallback = {
  //       ...config.resolve.fallback,
  //       fs: false,
  //       path: false,
  //       crypto: false,
  //       os: false,
  //       net: false,
  //       tls: false,
  //       child_process: false,
  //     };
  //   }
  //   config.resolve.alias = {
  //     ...config.resolve.alias,
  //     'node:crypto': 'crypto',
  //     'node:fs': 'fs',
  //     'node:path': 'path',
  //     'node:perf_hooks': 'perf_hooks',
  //   };
  //   return config;
  // },
};

export default nextConfig;