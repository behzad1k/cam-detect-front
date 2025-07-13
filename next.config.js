/** @type {import('next').NextConfig} */

// Determine if we're in production and should use base path
const isProduction = process.env.NODE_ENV === 'production';
const useBasePath = process.env.USE_BASE_PATH === 'true' || isProduction;

// Set base path conditionally
const basePath = useBasePath ? (process.env.BASE_PATH || '/cam-detection') : '';
const assetPrefix = useBasePath ? (process.env.ASSET_PREFIX || basePath) : '';

const nextConfig = {
    output: 'standalone',
    basePath: basePath,
    assetPrefix: assetPrefix,
    trailingSlash: true,

    experimental: {
        outputFileTracingRoot: undefined,
    },

    typescript: {
        // Enable strict type checking
        ignoreBuildErrors: false,
    },

    eslint: {
        // Enable ESLint during builds
        ignoreDuringBuilds: false,
    },

    images: {
        path: useBasePath ? `${basePath}/_next/image` : '/_next/image',
        domains: ['demo.seedeep.ai', 'localhost', 'api.seedeep.ai'],
    },

    generateEtags: false,
    poweredByHeader: false,

    // Enable source maps in development
    productionBrowserSourceMaps: false,

    // Optimize for development
    swcMinify: true,

    // Environment variables
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
        NEXT_PUBLIC_BASE_PATH: basePath,
        NEXT_PUBLIC_USE_BASE_PATH: useBasePath.toString(),
    },

    // Headers for CORS if needed
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

    // Webpack configuration for any custom needs
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        // Custom webpack config if needed
        return config;
    },

    // Conditional rewrites based on environment
    async rewrites() {
        // Only add rewrites in production or when USE_BASE_PATH is true
        if (!useBasePath) {
            return [];
        }

        return [
            {
                source: '/api/:path*',
                destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://api.seedeep.ai/cam-detection'}/:path*`,
            },
            {
                source: '/ws/:path*',
                destination: `${process.env.NEXT_PUBLIC_WS_URL || 'https://api.seedeep.ai/cam-detection/ws'}/:path*`,
            },
        ];
    },
}

module.exports = nextConfig
