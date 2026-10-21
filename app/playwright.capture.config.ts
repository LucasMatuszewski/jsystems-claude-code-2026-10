import { defineConfig } from "@playwright/test";

try {
  process.loadEnvFile("../.env");
} catch {
  /* .env is optional for typecheck */
}

const captureDir = `tests/fixtures/captures/${new Date().toISOString().slice(0, 10)}`;
// Contract tests run in this process and read the capture directory from env.
process.env.AI_CAPTURE_DIR = captureDir;

export default defineConfig({
  expect: { timeout: 90_000 },
  grep: /@capture/,
  retries: 0,
  testDir: "./tests/contract",
  testMatch: /.*\.contract\.ts/,
  timeout: 180_000,
  use: {
    baseURL: "http://localhost:3100",
  },
  webServer: {
    command: "npm run build && npm run start -- -p 3100",
    env: { AI_CAPTURE_DIR: captureDir },
    reuseExistingServer: false,
    timeout: 300_000,
    url: "http://localhost:3100",
  },
  workers: 1,
});
