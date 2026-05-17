/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  images: {
    domains: ['api.dicebear.com'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Force all pages to be dynamic - no static generation
  staticPageGenerationTimeout: 0,
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090'
    return process.env.NODE_ENV === 'production' ? [] : [
      {
        source: '/api/:path*',
        destination: `${apiBase}/api/:path*`,
      },
      {
        source: '/avatars/:path*',
        destination: `${apiBase}/avatars/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
