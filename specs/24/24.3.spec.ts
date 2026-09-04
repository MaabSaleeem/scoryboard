// 24.3 - Something went wrong, and Page not found
//
// Three captures. Read `briefs/24.md`, "24.3", with this.
//
// Three different screens say "this is not here", and they look nothing alike:
//
//   01  a route the app does not have - Next's own not-found page, no sidebar;
//   02  a route the app has, for a thing that does not exist - the app's
//       "<Thing> Not Found" notice inside the normal frame;
//   03  a page that crashed - the error boundary, "This page couldn't load",
//       on a bare white page with nothing else on it.
//
// The third is produced deterministically by opening the settings of a
// leaderboard Marc has no role on: the page fetches the team list, gets 403,
// and falls over rather than showing a permission message. That is a defect,
// and the article says so.
//
// --- Preconditions --------------------------------------------------------
//
// `node scripts/seed-24.mjs` must have run, for the leaderboard.

import { test, expect } from '@playwright/test';
import {
  KB24, fixtures24, context24, open24, unionBox, clearUnionBox, shot, type Fx24,
} from '../../lib/kb';

const ARTICLE = '24.3';

/** A well-formed id that nothing has. Fixed, so the URL is the same every run. */
const NOBODY = '000000000000000000000000';

let fx: Fx24;

test.beforeAll(async () => { fx = await fixtures24(); });

test('01 - Page not found', async ({ browser }) => {
  const { ctx, page } = await context24(browser, KB24.reader);
  const heading = page.getByRole('heading', { name: 'Page not found', exact: true });
  await open24(page, '/this-page-does-not-exist', heading);
  await expect(page.getByRole('link', { name: 'Go back to the homepage', exact: true })).toBeVisible();
  // No sidebar on this page, so nothing of Marc's is on screen to mask.
  await expect(page.locator('div[data-sidebar="sidebar 1"]')).toHaveCount(0);
  await shot(page, ARTICLE, '01-page-not-found');
  await ctx.close();
});

test('02 - Team Not Found', async ({ browser }) => {
  const { ctx, page } = await context24(browser, KB24.reader);
  const heading = page.getByRole('heading', { name: 'Team Not Found', exact: true });
  await open24(page, `/teams/${NOBODY}`, heading);
  const line = page.getByText('The team you are looking for does not exist.', { exact: true });
  const back = page.getByRole('button', { name: 'Back to Teams', exact: true });
  await expect(line).toBeVisible();
  await expect(back).toBeVisible();
  // The notice alone with a wide margin, as 24.1 clips its notices. The whole
  // main column is 1184 x 832 of grey around three lines of text.
  const box = await unionBox(page, [heading, line, back], 120);
  await shot(page, ARTICLE, '02-team-not-found', { clip: box });
  await clearUnionBox(page);
  await ctx.close();
});

test('03 - This page could not load', async ({ browser }) => {
  const { ctx, page } = await context24(browser, KB24.reader);
  // The apostrophe is typographic in the app's own copy: U+2019.
  const heading = page.getByRole('heading', { name: 'This page couldn’t load', exact: true });
  await open24(page, `/leaderboards/${fx.league}/settings`, heading);
  await expect(page.getByText('Reload to try again, or go back.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reload', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back', exact: true })).toBeVisible();
  // The whole app is gone: no sidebar, no header, no footer.
  await expect(page.locator('div[data-sidebar="sidebar 1"]')).toHaveCount(0);
  await expect(page.locator('footer')).toHaveCount(0);
  await shot(page, ARTICLE, '03-page-could-not-load');
  await ctx.close();
});
