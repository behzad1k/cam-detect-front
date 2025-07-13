const { loadEnvConfig } = require('@next/env')

// Load environment variables
const projectDir = process.cwd()
loadEnvConfig(projectDir)

/** @type {import('next').NextConfig} */

// Use environment variables with sensible defaults
const basePath = process.env.BASE_PATH || '';
const assetPrefix = process.env.ASSET_PREFIX || basePath;

const nextConfig = {
    output: 'standalone',
    basePath: basePath,
    assetPrefix: assetPrefix,
    trailingSlash: true,

    experimental: {
        outputFileTracingRoot: undefined,
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
        NEXT_PUBLIC_BASE_PATH: basePath,
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

    // Optional: Add some debugging info
    ...(process.env.NODE_ENV === 'development' && {
        onDemandEntries: {
            maxInactiveAge: 25 * 1000,
            pagesBufferLength: 2,
        },
    }),
}

// Debug logging in development
if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Next.js Config Debug:');
    console.log('  NODE_ENV:', process.env.NODE_ENV);
    console.log('  BASE_PATH:', basePath);
    console.log('  ASSET_PREFIX:', assetPrefix);
    console.log('  API_URL:', process.env.NEXT_PUBLIC_API_URL);
    console.log('  WS_URL:', process.env.NEXT_PUBLIC_WS_URL);
}

module.exports = nextConfig
