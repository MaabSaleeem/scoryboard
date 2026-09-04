// 24.1 - You do not have permission to do that
//
// Four captures. Read `briefs/24.md`, "24.1", with this.
//
// Marc is the reader: Free, Administrator of KB 24 United, on none of Owen's
// other teams. Every capture is Marc arriving somewhere his role does not
// reach, photographed as the app answers him.
//
// --- Preconditions --------------------------------------------------------
//
// `node scripts/seed-24.mjs` must have run. It guarantees Marc's Administrator
// row, Owen's dummy team, Owen's two match teams Marc is not on, and one
// Scheduled match between them on a fixed future date.
//
// --- The clock ------------------------------------------------------------
//
// Not frozen. The match page shows a "Match starts in" countdown, but it is in
// the MATCH DETAILS card and the fourth capture clips the hero above it.
//
// --- Clips ----------------------------------------------------------------
//
// The Access Denied and DUMMY TEAM notices sit alone in the middle of an
// otherwise empty grey column, 1184 x 832. The first run clipped that whole
// column and published 1800 rows of nothing around three lines of text, so both
// now clip a box drawn around the notice itself with a wide margin
// (unionBox), which is how the style guide wants "the element under discussion,
// with enough surrounding chrome to orient the reader".

import { test, expect } from '@playwright/test';
import {
  KB24, KB24_TEAMS, KB24_LEADERBOARD, fixtures24, context24, open24,
  cardHolding, matchHero24, unionBox, clearUnionBox, onScreen, shot, type Fx24,
} from '../../lib/kb';

const ARTICLE = '24.1';

let fx: Fx24;

test.beforeAll(async () => { fx = await fixtures24(); });

test('01 - Access Denied on a team you do not run', async ({ browser }) => {
  const { ctx, page } = await context24(browser, KB24.reader);
  const heading = page.getByRole('heading', { name: 'Access Denied', exact: true });
  await open24(page, `/teams/${fx.home}/settings`, heading);
  const line1 = page.getByText('You are not allowed to edit this team.', { exact: true });
  const line2 = page.getByText('Only team owners and administrators can access team settings.', { exact: true });
  await expect(line1).toBeVisible();
  await expect(line2).toBeVisible();
  // No API write and no redirect: the app decides this in the browser and
  // stays on the settings URL. Asserted so a future redirect fails loudly.
  expect(new URL(page.url()).pathname).toBe(`/teams/${fx.home}/settings`);
  const box = await unionBox(page, [heading, line1, line2], 120);
  await shot(page, ARTICLE, '01-access-denied-team-settings', { clip: box });
  await clearUnionBox(page);
  await ctx.close();
});

test('02 - a dummy team seen by anybody but its owner', async ({ browser }) => {
  const { ctx, page } = await context24(browser, KB24.reader);
  const heading = page.getByRole('heading', { name: 'DUMMY TEAM', exact: true });
  await open24(page, `/teams/${fx.dummy}`, heading);
  const line = page.getByText(/This team is dummy, and you don.t have permission to view it\./);
  const back = page.getByRole('button', { name: 'Back to Teams', exact: true });
  await expect(line).toBeVisible();
  await expect(back).toBeVisible();
  // The team's name is NOT on the page - the notice replaces the whole team
  // page. Asserted, because the article says so.
  await expect(page.getByText(KB24_TEAMS.dummy, { exact: true })).toHaveCount(0);
  // The padlock drawing sits about 130px above the heading; the margin takes it in.
  const box = await unionBox(page, [heading, line, back], 150);
  await shot(page, ARTICLE, '02-dummy-team-no-permission', { clip: box });
  await clearUnionBox(page);
  await ctx.close();
});

test('03 - Delete Team is greyed out for an Administrator', async ({ browser }) => {
  const { ctx, page } = await context24(browser, KB24.reader);
  const heading = page.getByRole('heading', { name: `Edit Team - ${KB24_TEAMS.united}` });
  await open24(page, `/teams/${fx.united}/settings`, heading);
  // Marc's own row says Admin: the capture is of an Administrator's view, not
  // an Owner's, and this is the proof.
  const members = cardHolding(page, 'TEAM PLAYERS');
  await expect(members.getByText('Admin', { exact: true }).first()).toBeVisible();
  const card = cardHolding(page, 'DELETE TEAM');
  const button = card.getByRole('button', { name: 'Delete Team', exact: true });
  await expect(button).toBeVisible();
  await expect(button).toBeDisabled();
  await shot(page, ARTICLE, '03-delete-team-disabled-admin', {
    clip: card,
    clipPad: 8,
    annotate: button,
  });
  await ctx.close();
});

test('04 - Match Preview (View Only) on a match you do not manage', async ({ browser }) => {
  const { ctx, page } = await context24(browser, KB24.reader);
  const heading = onScreen(page.getByRole('heading', { name: 'Match Preview (View Only)', exact: true })).first();
  await open24(page, `/matches/${fx.match}`, heading);
  // The league name proves the match fetch landed - the hero paints before it.
  await expect(onScreen(page.getByText(KB24_LEADERBOARD, { exact: true })).first()).toBeVisible();
  // A spectator has no START MATCH, no Add Note and no Request Payment, and
  // no PAYMENT tab in the strip.
  await expect(page.getByRole('button', { name: 'START MATCH' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Add Note' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Request Payment' })).toHaveCount(0);
  // The strip is a set of `role="tab"` elements, not buttons - a button locator
  // finds nothing and cost this capture two runs. The names are matched
  // case-insensitively because the team page's tabs are upper-cased by CSS
  // while these carry the upper case in the DOM; one regex serves both.
  await expect(page.getByRole('tab', { name: /^payment$/i })).toHaveCount(0);
  // The guided tour never opens: the seed sets isTourCompleted on both accounts.
  await expect(page.locator('dialog.shepherd-element')).toHaveCount(0);
  // The hero band plus the whole tab strip beneath it. Clipping the band alone
  // cut the strip's labels in half along the bottom edge on the first run.
  const firstTab = onScreen(page.getByRole('tab', { name: /^match details$/i })).first();
  const lastTab = onScreen(page.getByRole('tab', { name: /^keys$/i })).first();
  await expect(firstTab).toBeVisible();
  // No margin: the hero starts at the main column's left edge, and a margin
  // reaches into the sidebar - the first run published a 12px sliver of it.
  const box = await unionBox(page, [matchHero24(page), firstTab, lastTab], 0);
  await shot(page, ARTICLE, '04-match-preview-view-only', { clip: box });
  await clearUnionBox(page);
  await ctx.close();
});
