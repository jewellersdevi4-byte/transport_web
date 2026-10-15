import type { NextConfig } from 'next';
const config: NextConfig = { transpilePackages: ['@transport/shared-ui', '@transport/shared-types', '@transport/shared-utils', '@transport/api-client'], async rewrites() { return [{source:'/api/:path*',destination:`${process.env.API_INTERNAL_URL || 'http://127.0.0.1:4100'}/:path*`}]; } }; export default config;
