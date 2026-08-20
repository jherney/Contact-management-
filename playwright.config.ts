import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: '/tmp/playwright-report' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 1280, height: 800 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'echo "Server already running"',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 5000,
  },
  outputDir: '/tmp/playwright-test-results',
});