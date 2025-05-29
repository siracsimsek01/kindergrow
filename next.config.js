const { default: next } = require('next')

/** @type {import('next').NextConfig} */
const nextConfig = {
    compiler: {
      removeConsole: process.env.NODE_ENV === 'production',
    },
    eslint: {
      // Warning: This allows production builds to successfully complete even if
      // your project has ESLint errors.
      ignoreDuringBuilds: true,
    },
    reactStrictMode: true,
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
  
  module.exports = withBundleAnalyzer(nextConfig)