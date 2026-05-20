import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "e2e/playwright/tests",
  timeout: 120_000,
  workers: 1,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  use: {
    baseURL: baseURL || undefined,
    actionTimeout: 0,
    navigationTimeout: 60_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});
