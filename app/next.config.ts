import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// The credentials live in the repository-root .env; the app itself is in app/.
// Next has already loaded env files for app/ before this config runs, and
// @next/env caches that first result, so forceReload is required here;
// without it the root .env is silently skipped.
loadEnvConfig(
  path.resolve(process.cwd(), ".."),
  process.env.NODE_ENV !== "production",
  undefined,
  true
);

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
