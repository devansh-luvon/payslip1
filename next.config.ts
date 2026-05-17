import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs", "@stellar/stellar-sdk"],
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
