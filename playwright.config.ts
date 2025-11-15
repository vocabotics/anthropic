import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  // Test timeout
  timeout: 30 * 1000,

  // Test execution options
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  // Shared settings for all tests
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:3000',

    // Screenshots and videos
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',

    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,

    // Action options
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,
  },

  // Test projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Web server configuration
  webServer: [
    {
      command: 'cd apps/api && pnpm dev',
      url: 'http://localhost:3001/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: 'cd apps/web && pnpm dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
