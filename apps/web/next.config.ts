import type { NextConfig } from 'next';

const LIVE_BACKEND_URL = 'https://transport-backend-pzlp.onrender.com';

const config: NextConfig = {
  transpilePackages: [
    '@transport/shared-ui',
    '@transport/shared-types',
    '@transport/shared-utils',
    '@transport/api-client',
  ],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || LIVE_BACKEND_URL,
    API_INTERNAL_URL: process.env.API_INTERNAL_URL || LIVE_BACKEND_URL,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_INTERNAL_URL || LIVE_BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default config;
