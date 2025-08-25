/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Optimize images for production
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  
  // Environment configuration
  env: {
    KOZANGEN_VERSION: process.env.npm_package_version || '1.0.0'
  },
  
  // Production optimizations
  poweredByHeader: false,
  compress: true,
  
  // Enable static file serving from input directory
  async rewrites() {
    return [
      {
        source: '/input/:path*',
        destination: '/api/static/:path*',
      },
    ];
  },
};

module.exports = nextConfig;