import type { NextConfig } from "next";

// Next only reads env files from apps/web; also load the repo-root .env.local that sits beside .env.example.
try {
  process.loadEnvFile("../../.env.local");
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}

const nextConfig: NextConfig = {
  agentRules: false,
  transpilePackages: ["@sfa/contracts"],
};

export default nextConfig;
