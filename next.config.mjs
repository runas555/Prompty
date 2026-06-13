/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/System Volume Information/**',
          '**/$RECYCLE.BIN/**',
          '**/*.sys'
        ]
      };
    }
    return config;
  }
};

export default nextConfig;