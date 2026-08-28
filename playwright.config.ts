import { defineConfig } from '@playwright/test';
import 'dotenv/config';

// Capture settings from docs/style-guide.md. These are not per-spec judgement
// calls - every spec inherits them, and no spec overrides them.
export default defineConfig({
  testDir: './specs',
  outputDir: './test-results',
  fullyParallel: false,          // fixtures are shared; serial keeps captures stable
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 120_000,
  expect: { timeout: 15_000 },
  use: {
    // Without this a click on an element that never becomes actionable blocks
    // for the whole test timeout instead of failing where it happened.
    actionTimeout: 20_000,
    baseURL: process.env.SCORYBOARD_APP_BASE,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    timezoneId: 'Europe/London',
    locale: 'en-GB',
    contextOptions: { reducedMotion: 'reduce' },
    // Every context starts signed out. Specs sign their persona in through a
    // freshly minted signin URL, so no spec inherits another spec's session.
    storageState: { cookies: [], origins: [] },
    trace: 'off',
    video: 'off',
    screenshot: 'off',
  },
  projects: [{ name: 'desktop', use: {} }],
});
