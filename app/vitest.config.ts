import path from "node:path";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const sharedSetupFiles = ["./tests/setup/vitest.setup.ts"];

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      "server-only": path.resolve(
        import.meta.dirname,
        "tests/setup/server-only-stub.ts"
      ),
    },
  },
  test: {
    exclude: ["node_modules", "tests/e2e/**", "tests/contract/**", ".next"],
    passWithNoTests: false,
    projects: [
      {
        extends: true,
        test: {
          environment: "node",
          include: [
            "lib/case/**/*.test.ts",
            "lib/ai/**/*.test.ts",
            "lib/utils.test.ts",
            "tests/integration/**/*.test.ts",
            "tests/helpers/**/*.test.ts",
            "tests/fixtures/**/*.test.ts",
          ],
          name: "node",
          setupFiles: sharedSetupFiles,
        },
      },
      {
        extends: true,
        test: {
          environment: "jsdom",
          include: [
            "components/**/*.test.{ts,tsx}",
            "lib/session/**/*.test.{ts,tsx}",
            "lib/image/**/*.test.{ts,tsx}",
          ],
          name: "dom",
          setupFiles: sharedSetupFiles,
        },
      },
    ],
  },
});
