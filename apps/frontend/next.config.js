/** @type {import('next').NextConfig} */
const nextConfig = {
    // ISR revalidation defaults
    experimental: {
        // Enable server actions for form submissions
        serverActions: { bodySizeLimit: '1mb' },
    },
    // Edge-compatible pages config
    images: {
        remotePatterns: [],
        formats: ['image/avif', 'image/webp'],
    },
    // Generate static params at build for known GPUs
    generateBuildId: () => `build-${Date.now()}`,
    headers: async () => [
        {
            source: '/gpu/:path*',
            headers: [
                { key: 'Cache-Control', value: 's-maxage=60, stale-while-revalidate=300' },
            ],
        },
        {
            source: '/out/:path*',
            headers: [
                { key: 'Cache-Control', value: 'no-store' },
            ],
        },
    ],
    rewrites: async () => [],
}

module.exports = nextConfig
