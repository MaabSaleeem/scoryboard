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
    // reducedMotion is the style guide's; blocking service workers is what makes
    // page.route() work at all.
    //
    // The app registers a service worker (it ships a web manifest), and a request
    // a service worker makes never reaches Playwright's route handler. Every
    // interception written before 2026-08-29 was therefore silently doing
    // nothing: collection 01's blockPromos() has never once blocked a promo
    // campaign - what actually hid the banner was quiet01()'s stylesheet. Found
    // in collection 02, where the campaign sits on the page 02.1 documents and
    // no stylesheet could be used because the banner is not the subject.
    contextOptions: { reducedMotion: 'reduce', serviceWorkers: 'block' },
    // Every context starts signed out. Specs sign their persona in through a
    // freshly minted signin URL, so no spec inherits another spec's session.
    storageState: { cookies: [], origins: [] },
    trace: 'off',
    video: 'off',
    screenshot: 'off',
  },
  projects: [{ name: 'desktop', use: {} }],
});
