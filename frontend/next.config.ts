import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  distDir: '.next',
  experimental: {
    appDir: true,
  },
};

export default nextConfig;
