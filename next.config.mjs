/**
 * Next.js Configuration
 *
 * Configures build settings, security headers, and external integrations.
 *
 * @see https://nextjs.org/docs/app/api-reference/next-config-js
 */

import bundleAnalyzer from '@next/bundle-analyzer';

/**
 * Bundle analyzer wrapper for build analysis.
 * Enable with ANALYZE=true environment variable.
 */
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Optimize CSS in production
    optimizeCss: process.env.NODE_ENV === 'production',
  },

  // Standalone output for Docker deployments (production only)
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),

  // Remove console logs in production builds
  ...(process.env.NODE_ENV === 'production' && {
    compiler: {
      removeConsole: {
        exclude: ['error', 'warn'], // Keep error and warn logs
      },
    },
  }),

  // Remote image domains for next/image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
    // Image optimization settings
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  /**
   * HTTP security headers configuration.
   *
   * @remarks
   * Security headers are applied to all routes.
   * Static assets get cache-control headers for CDN optimization.
   */
  async headers() {
    /**
     * Security headers applied to all routes.
     *
     * - X-DNS-Prefetch-Control: Enable DNS prefetching for performance
     * - Strict-Transport-Security: Enforce HTTPS for 1 year with preload
     * - X-Frame-Options: Prevent clickjacking attacks
     * - X-Content-Type-Options: Prevent MIME type sniffing
     * - X-XSS-Protection: Legacy XSS protection (modern browsers use CSP)
     * - Referrer-Policy: Control referrer information sent
     * - Permissions-Policy: Disable camera, microphone, geolocation
     * - Content-Security-Policy: Restrict resource loading sources
     */
    const securityHeaders = [
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on'
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload'
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY'
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block'
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin'
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()'
      },
      {
        // CSP directives controlling resource loading
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "img-src 'self' data: https: blob:",
          "font-src 'self' data: https://fonts.gstatic.com",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://res.cloudinary.com https://generativelanguage.googleapis.com https://api.openai.com https://api.anthropic.com",
          "frame-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
          "upgrade-insecure-requests"
        ].join('; ')
      }
    ];

    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
      // Static asset caching (1 year, immutable)
      {
        source: '/favicon.ico',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Content-Type', value: 'image/x-icon' },
        ],
      },
      {
        source: '/lola-logo.ico',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Content-Type', value: 'image/x-icon' },
        ],
      },
      {
        source: '/icon.ico',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Content-Type', value: 'image/x-icon' },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
