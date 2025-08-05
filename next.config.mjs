/** @type {import('next').NextConfig} */
const nextConfig = {
  // Workaround for WalletConnect build issues
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

export default nextConfig;
