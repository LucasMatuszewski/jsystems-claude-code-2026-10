import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// The credentials live in the repository-root .env; the app itself is in app/.
loadEnvConfig(path.resolve(process.cwd(), ".."));

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactCompiler: true,
  // Production builds type-check application code only; `npm run typecheck`
  // still covers the test files through tsconfig.json.
  typescript: {
    tsconfigPath: "tsconfig.build.json",
  },
};

export default nextConfig;
