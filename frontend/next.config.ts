import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  optimizeFonts: false,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        encoding: false,
      };
    }
    return config;
  },
};

export default nextConfig;

