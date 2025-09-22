import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      rules: {},
    },
  },
  // Ensure env vars available on server and client where needed
  // Expose NEXT_PUBLIC_API_BASE if provided
  env: {},
};

export default nextConfig;
