// 10.10 - Live viewers, and following a match from another device.
//
// Two people on one match at the same moment, which is the only way this article
// can be captured - so this is the one spec in the collection that makes two
// browser contexts inside a single test. Playwright gives each *test* a fresh
// context, and every other spec here relies on that; here the whole subject is
// what the second context sees while the first one is scoring.
//
// Two findings hold the article up.
//
// **The FEED panel counts who is watching.** A green pill reading `ONLINE n`. It
// read 1 for the owner alone and 2 the moment a squad member opened the same match,
// with no reload on either side.
//
// **The match page is a Firestore subscription.** `onSnapshot` on the
// `matches/{id}` document and on its `events` subcollection, ordered by timestamp
// (config/api.md). `GET /matches/:id/events` answers 404 - there is no REST read
// for the feed at all. That is why the follower's score changes on its own, and
// why this spec asserts on the follower's screen rather than on the API: the API
// is not what the article is about.
//
// This is also the one spec that must NOT mask the ONLINE pill. `moving10()` takes
// `keepOnline` for that.

import { test, expect } from '@playwright/test';
import {
  shot, signinUrl, onScreen, parkPointer,
  fixtures10, freezeClock10, quiet10, warm10, settled10, afterKickOff,
  matchPanel, onlinePill, scoreStepper, scoreText, timerPill,
  sidebarIdentity10, moving10,
  KB10, KB10_TIMER_MINUTES, APP,
} from '../../lib/kb';

test.describe('10.10 Live viewers, and following a match from another device', () => {
  test('the viewer count, and a goal arriving on its own', async ({ browser }) => {
    const fx = await fixtures10();
    const t = await fx.throwaway('live');
    const when = afterKickOff(t.match, KB10_TIMER_MINUTES);

    // Both contexts are made by hand and closed in the same `finally`, so a
    // failure cannot leave a browser holding a presence record open and skew the
    // count on the next run.
    const owner = await browser.newContext();
    const follower = await browser.newContext();
    try {
      const ownerPage = await owner.newPage();
      const followerPage = await follower.newPage();

      // Signed in the long way round rather than through signInAs(), which takes
      // the `page` fixture. Same flow: a freshly minted signin URL, never a pasted
      // token.
      const open = async (page: typeof ownerPage, email: string) => {
        await page.goto(await signinUrl(email));
        await page.waitForURL((u) => !u.pathname.startsWith('/signin'), { timeout: 45_000 });
        await page.goto('/teams');
        await warm10(page);
        await freezeClock10(page, when);
        await page.goto(`/matches/${t.id}`);
        await quiet10(page);
        await settled10(page);
      };

      await open(ownerPage, KB10.pro);
      const ownerMask = [sidebarIdentity10(ownerPage, 'Mo KB'), ...moving10(ownerPage, { keepOnline: true })];

      // 01 - one person watching: the owner. The pill's text is "ONLINE 1" on
      // screen and `🟢 Online 1` in the markup - title case, uppercased by CSS -
      // which is why onlinePill() matches case-insensitively.
      const ownerPill = onlinePill(ownerPage);
      await expect(ownerPill).toBeVisible({ timeout: 30_000 });
      await expect(ownerPill).toHaveText(/online\s*1/i);
      await parkPointer(ownerPage);
      await shot(ownerPage, '10.10', '01-online-one', {
        clip: matchPanel(ownerPage, 'feed'), annotate: ownerPill, mask: ownerMask,
      });

      // 02 - the follower opens the same match and the count goes up on the
      // owner's screen, with nothing refreshed.
      await open(followerPage, KB10.player);
      await expect(onlinePill(ownerPage)).toHaveText(/online\s*2/i, { timeout: 30_000 });
      await parkPointer(ownerPage);
      await shot(ownerPage, '10.10', '02-online-two', {
        clip: matchPanel(ownerPage, 'feed'), annotate: onlinePill(ownerPage), mask: ownerMask,
      });

      // 03 - the follower's own view. Read-only: no timer, no steppers, no card
      // buttons. The score and the count are both live.
      const followerMask = [
        sidebarIdentity10(followerPage, 'Pip KB'),
        ...moving10(followerPage, { keepOnline: true }),
      ];
      await expect(timerPill(followerPage)).toHaveCount(0);
      await expect(followerPage.locator('div[class*="rounded-full"][class*="border-blue-600"]')
        .filter({ has: followerPage.locator('button.w-8.h-8') })).toHaveCount(0);
      await expect(onlinePill(followerPage)).toHaveText(/online\s*2/i);
      await expect(scoreText(followerPage)).toHaveText('0 - 0');
      await settled10(followerPage);
      await parkPointer(followerPage);
      await shot(followerPage, '10.10', '03-follower-view', { mask: followerMask });

      // 04 - the owner awards a goal and the follower's page changes by itself.
      // Nothing is reloaded on the follower's side, and that is the assertion:
      // the score goes to 1-0 and the goal appears on their feed.
      await (await scoreStepper(ownerPage, 'home', 'plus')).click();
      await expect(scoreText(followerPage)).toHaveText('1 - 0', { timeout: 30_000 });
      const arrived = onScreen(
        matchPanel(followerPage, 'feed').getByText(/awarded a goal/),
      ).first();
      await expect(arrived).toBeVisible({ timeout: 30_000 });
      await settled10(followerPage);
      await parkPointer(followerPage);
      await shot(followerPage, '10.10', '04-score-arrived', {
        annotate: scoreText(followerPage), mask: followerMask,
      });
    } finally {
      await owner.close();
      await follower.close();
      expect(await fx.cancel(t.id), 'the throwaway must be cancelled').toBe(200);
    }
  });
});
