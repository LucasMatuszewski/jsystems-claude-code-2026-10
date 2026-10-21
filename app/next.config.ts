import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// The credentials live in the repository-root .env; the app itself is in app/.
loadEnvConfig(path.resolve(process.cwd(), ".."));

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactCompiler: true,
};

export default nextConfig;
