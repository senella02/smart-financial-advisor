import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  transpilePackages: ["@sfa/contracts"],
  serverExternalPackages: ["node:sqlite"],
};

export default nextConfig;
