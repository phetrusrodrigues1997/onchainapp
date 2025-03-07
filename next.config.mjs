/** @type {import('next').NextConfig} */
const nextConfig = {
    // Silence warnings
    eslint: {
      ignoreDuringBuilds: true,
  },
    // https://github.com/WalletConnect/walletconnect-monorepo/issues/1908
    webpack: (config) => {
      config.externals.push('pino-pretty', 'lokijs', 'encoding');
      
      return config;
    },
  };
  
  export default nextConfig;
  