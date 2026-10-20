import type { NextConfig } from 'next';

const LIVE_BACKEND_URL = 'https://transport.devijewellers.in';

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
  async redirects() {
    return [
      {
        source: '/downloads/:path*',
        destination: 'https://drive.usercontent.google.com/download?id=1MoQLR6XmFy_B9uAF1okhc87vrH8CqJat&export=download&confirm=t',
        permanent: false,
      },
    ];
  },
};

export default config;
