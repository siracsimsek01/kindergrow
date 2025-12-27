/** @type {import('next').NextConfig} */
const nextConfig = {
    compiler: {
      removeConsole: process.env.NODE_ENV === 'production',
    },
    reactStrictMode: true,
    // Reduce the number of pages built in parallel
    experimental: {
      workerThreads: false,
      cpus: 1
    },
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'img.clerk.com',
        },
      ],
    },
    
  }

  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  })
  
  module.exports = withBundleAnalyzer(nextConfig)