/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Enable experimental features that are stable in Next.js 14
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['@radix-ui/react-dropdown-menu', 'framer-motion', 'react-hot-toast'],
    // Enable typed routes
    typedRoutes: true,
  },

  // Configure images
  images: {
    // Allow images from these domains
    domains: ['localhost'],
    // Enable modern image formats
    formats: ['image/avif', 'image/webp'],
  },

  // Enable SWC minification and compilation
  swcMinify: true,

  // Configure webpack
  webpack: (config, { isServer }) => {
    // Handle Node.js built-in modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        path: false,
        url: false,
        module: false,
        string_decoder: false,
      }
    }

    // Prevent client-side bundling of server-only modules
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        bcrypt: false,
        'node-pre-gyp': false,
        'node-gyp': false,
        nock: false,
        '@mswjs/interceptors': false,
        'oidc-token-hash': false,
        'openid-client': false,
      }
    }

    // Handle native modules
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    })

    // Handle C# files
    config.module.rules.push({
      test: /\.cs$/,
      use: 'ignore-loader',
    })

    // Handle HTML files
    config.module.rules.push({
      test: /\.html$/,
      use: 'ignore-loader',
    })

    // Handle any other problematic files
    config.module.rules.push({
      test: /\.(js|mjs|jsx|ts|tsx)$/,
      include: [
        /node_modules\/@mapbox\/node-pre-gyp/,
        /node_modules\/node-gyp/,
        /node_modules\/nock/,
        /node_modules\/@mswjs\/interceptors/,
        /node_modules\/oidc-token-hash/,
        /node_modules\/openid-client/,
      ],
      use: 'ignore-loader',
    })

    // Handle bcrypt and related modules
    config.module.rules.push({
      test: /bcrypt\.js$/,
      use: 'ignore-loader',
    })

    // Handle middleware files
    config.module.rules.push({
      test: /middleware\.(ts|js)$/,
      use: 'ignore-loader',
    })

    // Handle edge runtime files
    config.module.rules.push({
      test: /edge-runtime-webpack\.js$/,
      use: 'ignore-loader',
    })

    // Handle next-auth files
    config.module.rules.push({
      test: /next-auth\.js$/,
      use: 'ignore-loader',
    })

    // Handle middleware manifest
    config.module.rules.push({
      test: /middleware-manifest\.json$/,
      use: 'ignore-loader',
    })

    // Handle next-intl files
    config.module.rules.push({
      test: /next-intl\.js$/,
      use: 'ignore-loader',
    })

    return config
  },

  // Configure headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig 