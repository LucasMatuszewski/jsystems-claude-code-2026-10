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
    // E-18 types the date field keyboard-only in US order (mmddyyyy); the
    // browser takes the field order from the OS locale (pl_PL on the VMs).
    launchOptions: {
      env: {
        ...process.env,
        LANG: "en_US.UTF-8",
        LANGUAGE: "en_US",
        LC_ALL: "en_US.UTF-8",
      },
    },
    locale: "en-US",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  // Playwright starts webServer entries in parallel, so the 3200 server waits
  // until the 3000 entry (build + start) responds before it starts itself.
  webServer: [
    {
      command: "npm run build && npm run start",
      env: { AI_CAPTURE_DIR: "", PORT: "3000" },
      reuseExistingServer: true,
      stderr: "pipe",
      stdout: "pipe",
      timeout: 300_000,
      url: "http://localhost:3000",
    },
    {
      command: `node -e "const w=()=>fetch('http://localhost:3000/').then(()=>process.exit(0),()=>setTimeout(w,1000));w()" && npm run start -- -p 3200`,
      env: {
        AI_CAPTURE_DIR: "",
        LLM_MODEL: "invalid/model-does-not-exist",
        PORT: "3200",
        VISION_MODEL: "invalid/model-does-not-exist",
      },
      reuseExistingServer: false,
      stderr: "pipe",
      stdout: "pipe",
      timeout: 420_000,
      url: "http://localhost:3200",
    },
  ],
  workers: 2,
});
