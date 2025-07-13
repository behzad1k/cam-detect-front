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

    // Environment variables
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

module.exports = nextConfig
