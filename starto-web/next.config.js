/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
        domains: ['api.dicebear.com'],
        dangerouslyAllowSVG: true,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
    // Allow backend API calls during SSR within Docker network
    async rewrites() {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090';
        return process.env.NODE_ENV === 'production' ? [] : [
            {
                source: '/api/:path*',
                destination: `${apiBase}/api/:path*`,
            },
            {
                source: '/avatars/:path*',
                destination: `${apiBase}/avatars/:path*`,
            },
        ];
    },
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig;
