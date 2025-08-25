/** @type {import('next').NextConfig} */
const nextConfig = {
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