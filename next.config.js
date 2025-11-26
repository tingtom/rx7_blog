/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Enable static exports
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '/**',
      },
    ],
    unoptimized: true, // Required for static export
  },
  // Handle GitHub Pages path prefix
  basePath: process.env.NODE_ENV === 'production' ? '/rx7_blog' : '',
}

module.exports = nextConfig
