/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Ignore TypeScript build errors
  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ Ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Workaround for WalletConnect build issues
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

export default nextConfig;
