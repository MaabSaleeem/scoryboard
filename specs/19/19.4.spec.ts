// 19.4 - How average ratings are calculated.
//
// Read-only. Nothing here writes anything.
//
// The average and the count appear in three places and are rendered the same way
// in all of them: the match header, a team page header and a player page header.
// The count is a real `<button class="text-blue-400 underline">` and it opens a
// read-only list of every rating the average is made of. That list is the only
// breakdown the app offers - `GET /ratings/:type/:id/summary` also answers a
// `distribution` histogram and **no screen renders it**, so the article does not
// mention one.
//
// --- The number this article exists for ------------------------------------
//
// Pia's three ratings are 4, 5 and 5. The mean is 4.666..., the API answers
// `4.67` and the header reads **4.7**. The team's two are 4 and 5, mean 4.5,
// shown `4.5`. Those two numbers are the whole point: one rounds and one does
// not, and a reader who has added their own stars up wants to know why the
// header disagrees with their arithmetic. lib/fixtures-19.mjs picked the ratings
// to produce exactly this pair, and scripts/seed-19.mjs refuses to finish if
// they come out any other way.
//
// --- The label is singular at one ------------------------------------------
//
// `1 review`, `2 reviews`. reviewsButton() takes the whole string rather than a
// count, so a fixture change that dropped a rating fails on the locator instead
// of quietly finding a different button.

import { test, expect } from '@playwright/test';
import {
  shot, context19, fixtures19, reviewsButton, headerIdentity19, settled08,
  ratingHeader19,
  asUser, KB19, KB19_AVERAGES, KB19_NAMES,
} from '../../lib/kb';

test.describe('19.4 How average ratings are calculated', () => {
  test('the average on a team and on a player, and the reviews it is made of', async ({ browser }) => {
    const fx = await fixtures19();

    const pia = await context19(browser, KB19.player, `/teams/${fx.teamId}`);
    try {
      const page = pia.page;

      // The header paints from the page shell and the rating arrives with
      // `GET /ratings`, so the average itself is the gate - not the team name.
      const average = page.getByText(KB19_AVERAGES.team.shown, { exact: true }).first();
      await expect(average).toBeVisible({ timeout: 30_000 });
      const reviews = reviewsButton(page, `${KB19_AVERAGES.team.totalCount} reviews`);
      await expect(reviews).toBeVisible();

      // The rating lands early and the rest of the page does not. A team page
      // goes on to fetch statistics, the line-up and the comment thread, and the
      // first run threw on shot()'s own skeleton backstop with the header
      // already correct. settled08() waits for both the skeletons and the
      // spinners.
      await settled08(page);

      // --- 01: the average on a team ------------------------------------------
      //
      // Clipped to the header block rather than the whole page: the team page
      // runs to statistics, a line-up and a comment panel, and a full-page
      // capture would make the two numbers this article is about a fifth of an
      // inch tall. See ratingHeader19() for what NOT to clip to.
      await shot(page, '19.4', '01-team-average', {
        clip: ratingHeader19(average),
        clipPad: 12,
        mask: [headerIdentity19(page)],
        annotate: reviews,
      });

      // --- 02: the list the average is made of ---------------------------------
      await reviews.click();
      const dialog = page.getByRole('dialog').last();
      await expect(dialog).toBeVisible({ timeout: 15_000 });
      // Both reviewers and both written reviews. Asserted because these are what
      // the article's prose adds up for the reader: Pia's 4 and Pat's 5 make the
      // 4.5 in the header above.
      //
      // Pia and Pat, NOT Ollie - he rates the match, the player and the referee
      // and not this team. The first run asserted Ollie and failed, which is how
      // the kebab in the next comment came to light.
      await expect(dialog.getByRole('button', { name: KB19_NAMES.player })).toBeVisible();
      await expect(dialog.getByRole('button', { name: KB19_NAMES.pro })).toBeVisible();
      await expect(dialog.getByText('Well drilled side.', { exact: true })).toBeVisible();
      await expect(dialog.getByText('Best we have played all season.', { exact: true })).toBeVisible();
      // The dates in this list are the day the seed ran, and they are not what
      // the article is about. commentTimes() does not match them - they are a
      // bare "02 Sept 2026" - so they are masked by their own pattern.
      const reviewDates = dialog.getByText(/^\d{2}\s\w{3,4}\s\d{4}$/);
      await shot(page, '19.4', '02-reviews-list', {
        clip: dialog,
        clipPad: 8,
        mask: [reviewDates],
      });
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden({ timeout: 15_000 });

      // --- 03: the same idea on a player, and the rounding ---------------------
      //
      // `/player/:playerId`, singular. `/players/:id` is Page not found - see
      // config/api.md, "App routes - singular and plural are different pages".
      await page.goto(`/player/${fx.playerId}`);
      const playerAverage = page.getByText(KB19_AVERAGES.player.shown, { exact: true }).first();
      await expect(playerAverage).toBeVisible({ timeout: 30_000 });
      const playerReviews = reviewsButton(page, `${KB19_AVERAGES.player.totalCount} reviews`);
      await expect(playerReviews).toBeVisible();
      // Same as the team page, and worse: a player profile also loads the
      // activity feed, the leaderboard table and the teams strip.
      await settled08(page);
      // headerIdentity19() masks the sidebar name and NOT this page's own
      // heading, which is also "Pia KB" - see the helper. The heading is part of
      // the subject here and docs/style-guide.md forbids masking the subject.
      await shot(page, '19.4', '03-player-average', {
        clip: ratingHeader19(playerAverage),
        clipPad: 12,
        mask: [headerIdentity19(page)],
        annotate: playerAverage,
      });
    } finally {
      await pia.ctx.close();
    }

    // Read-only, and proved: every average is what the seed asserted, and the
    // API's own rounding is the 4.67 the header shows as 4.7.
    const player = await asUser(fx.sessions.player.token, `/ratings/player/${fx.playerId}/summary`);
    expect(player.body?.data?.averageRating).toBe(KB19_AVERAGES.player.averageRating);
    expect(player.body?.data?.totalCount).toBe(KB19_AVERAGES.player.totalCount);
    const team = await asUser(fx.sessions.player.token, `/ratings/team/${fx.teamId}/summary`);
    expect(team.body?.data?.averageRating).toBe(KB19_AVERAGES.team.averageRating);
    expect(team.body?.data?.totalCount).toBe(KB19_AVERAGES.team.totalCount);
  });
});
