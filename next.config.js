/** @type {import('next').NextConfig} */
const nextConfig = {
    swcMinify: true,
    compiler: {
      removeConsole: process.env.NODE_ENV === 'production',
    },
    // Reduce the number of pages built in parallel
    experimental: {
      workerThreads: false,
      cpus: 1
    },
    images: {
      domains: ['img.clerk.com'],
    },
    
  }

  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  })
  
  module.exports = nextConfig