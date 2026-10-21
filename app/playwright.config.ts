import { defineConfig, devices } from "@playwright/test";

try {
  process.loadEnvFile("../.env");
} catch {
  /* .env is optional for typecheck */
}

// Empty optional variables in .env must not override defaults (e.g. PORT=).
for (const name of ["PORT", "VISION_MODEL", "POLICIES_DIR", "AI_CAPTURE_DIR"]) {
  if (process.env[name] === "") {
    delete process.env[name];
  }
}

export default defineConfig({
  expect: { timeout: 90_000 },
  fullyParallel: false,
  globalSetup: "./tests/global-setup.ts",
  projects: [
    {
      name: "contract",
      testDir: "./tests/contract",
      testMatch: /.*\.contract\.ts/,
    },
    {
      name: "chromium",
      testDir: "./tests/e2e",
      testIgnore: /failure\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      grep: /@smoke/,
      name: "firefox",
      testDir: "./tests/e2e",
      testIgnore: /failure\.spec\.ts/,
      use: { ...devices["Desktop Firefox"] },
    },
    {
      grep: /@smoke/,
      name: "webkit",
      testDir: "./tests/e2e",
      testIgnore: /failure\.spec\.ts/,
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "failure",
      testDir: "./tests/e2e",
      testMatch: /failure\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3200",
      },
    },
  ],
  reporter: [["list"], ["html", { open: "never" }]],
  retries: 0,
  testDir: "./tests",
  timeout: 180_000,
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  // The 3200 server starts after the first entry's build has finished.
  webServer: [
    {
      command: "npm run build && npm run start",
      env: { AI_CAPTURE_DIR: "", PORT: "3000" },
      reuseExistingServer: true,
      timeout: 300_000,
      url: "http://localhost:3000",
    },
    {
      command: "npm run start -- -p 3200",
      env: {
        AI_CAPTURE_DIR: "",
        LLM_MODEL: "invalid/model-does-not-exist",
        PORT: "3200",
        VISION_MODEL: "invalid/model-does-not-exist",
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: "http://localhost:3200",
    },
  ],
  workers: 2,
});
