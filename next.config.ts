import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /**
   * Dev + Windows: missing numeric chunks (`./447.js`) and broken `_not-found` usually come from
   * a stale webpack filesystem cache or async server chunks. We disable webpack persistent cache
   * in dev and turn off splitting/runtime chunk so fewer moving parts touch `.next/server`.
   *
   * After changing this, run `npm run clean` once, stop all `next dev` processes, then `npm run dev`.
   */
  webpack: (config, { dev }) => {
    if (!dev) return config;

    // Avoid reusing a corrupted dev cache (common cause of MODULE_NOT_FOUND for ./NNN.js).
    config.cache = false;

    config.optimization = {
      ...config.optimization,
      minimize: false,
      splitChunks: false,
      runtimeChunk: false,
    };

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
