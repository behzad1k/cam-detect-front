const { loadEnvConfig } = require('@next/env')

// Load environment variables
const projectDir = process.cwd()
loadEnvConfig(projectDir)

/** @type {import('next').NextConfig} */

// Only use basePath in production when ENABLE_BASE_PATH is true
const useBasePath = process.env.ENABLE_BASE_PATH === 'true' && process.env.NODE_ENV === 'production';
const basePath = useBasePath ? '/cam-detection' : '';
const assetPrefix = useBasePath ? '/cam-detection' : '';

const nextConfig = {
    output: 'standalone',
    basePath: basePath,
    assetPrefix: assetPrefix,
    trailingSlash: true,
    experimental: {
        webpackBuildWorker: true,
    },

    typescript: {
        ignoreBuildErrors: false,
    },

    eslint: {
        ignoreDuringBuilds: false,
    },

    images: {
        path: basePath ? `${basePath}/_next/image` : '/_next/image',
        domains: ['demo.seedeep.ai', 'localhost', 'api.seedeep.ai'],
    },

    generateEtags: false,
    poweredByHeader: false,
    productionBrowserSourceMaps: false,
    swcMinify: true,

    // Environment variables for client-side
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    },

    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
                    },
                ],
            },
        ];
    },

    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        return config;
    },
}

// Debug logging
console.log('🔧 Next.js Config:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  ENABLE_BASE_PATH:', process.env.ENABLE_BASE_PATH);
console.log('  useBasePath:', useBasePath);
console.log('  basePath:', basePath);
console.log('  assetPrefix:', assetPrefix);

module.exports = nextConfig
