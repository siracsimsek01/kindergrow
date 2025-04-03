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
    }
  }

  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  })
  
  module.exports = nextConfig