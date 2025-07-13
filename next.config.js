/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    assetPrefix: '/cam-detection',
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
        path: '/cam-detection/_next/image',
        domains: ['demo.seedeep.ai', 'localhost'],
    },
    generateEtags: false,
    poweredByHeader:
        false,
    // Enable source maps in development
    productionBrowserSourceMaps:
        false,
    // Optimize for development
    swcMinify:
        true,
    // Environment variables
    env:
        {
            NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
            NEXT_PUBLIC_WS_URL:
            process.env.NEXT_PUBLIC_WS_URL,
        }
    ,
// Headers for CORS if needed
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    {key: 'Access-Control-Allow-Origin', value: '*'},
                    {key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT'},
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
                    },
                ],
            },
        ];
    }
    ,
// Webpack configuration for any custom needs
    webpack: (config, {buildId, dev, isServer, defaultLoaders, webpack}) => {
        // Custom webpack config if needed
        return config;
    },
    async rewrites() {
        return [
            {
                source: '/cam-detection/:path*',
                destination: 'https://back.sevenskyconsulting.com/cam-detection/:path*',
            },
            {
                source: '/ws/:path*',
                destination: 'https://back.sevenskyconsulting.com/ws/:path*',
            },
        ];
    }
    ,
}

module.exports = nextConfig
