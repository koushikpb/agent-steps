import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  timeout: 60_000,
  retries: 1,
  reporter: 'list',
  use: { baseURL: 'http://localhost:3117', browserName: 'chromium' },
  webServer: {
    command: 'npm run dev', // NEXT_TELEMETRY_DISABLED=1 next dev -p 3117
    url: 'http://localhost:3117',
    reuseExistingServer: false, // never test a foreign server; the step kills :3117 first
    timeout: 120_000,
  },
});
