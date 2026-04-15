import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['playwright-core', '@sparticuz/chromium'],
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Absolute path so webpack can resolve from ../src/ files outside the website dir
      config.resolve.alias['playwright'] = require.resolve('playwright-core');
    }
    return config;
  },
};

export default nextConfig;
