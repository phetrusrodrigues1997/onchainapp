/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure external image domains for Next.js Image component
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'dynamic-assets.coinbase.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static1.tokenterminal.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'zengo.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's3.coinmarketcap.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's2.coinmarketcap.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media-cldnry.s-nbcnews.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  // Workaround for WalletConnect build issues
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

export default nextConfig;
