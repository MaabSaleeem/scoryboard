// 10.3 - Starting, pausing and ending a match.
//
// One button in one place changes four times, and that is the whole article:
//
//   Scheduled        START MATCH
//   Live             the timer pill, counting down, with a pause icon
//   Paused           the same pill with a play icon
//   Live at 00:00    END MATCH
//   Finished         nothing at all
//
// **END MATCH does not exist until full time.** Two exploration runs went looking
// for it in the gear menu and down the page body before the browser clock was
// pushed past the duration. That is why the third test freezes to kick-off plus 61
// minutes - the clock is not a convenience here, it is the only way to reach the
// control.
//
// Four things this spec is careful about.
//
// **It does not press START MATCH on the fixture.** Starting it would consume it,
// and the fixture is what 10.1 and 10.2 photograph. Shot 01 is the button, not the
// click.
//
// **Pausing and ending are in separate tests, on separate throwaways.** They were
// one test for two runs and it did not work: pausing under a frozen clock makes the
// app record a pause of about eleven minutes - the gap between the server's real
// `pausedAt` and the frozen now - and full time then moves out by that much, so
// END MATCH never appeared where it was expected. Time paused really is added back,
// which is the article's own claim; the fault was asking one test to demonstrate
// two clock-sensitive behaviours at once. A test that never pauses reaches full
// time at exactly `startedAt + duration`.
//
// **The pause capture masks the pill's digits, and must not reload the page.**
//
// Two findings sit behind that one line. First: the figure the pill shows once the
// match is paused is drawn from the `pausedAt` the SERVER stamps, and the server
// ignores a `pausedAt` sent in the body - so a frozen clock cannot pin it and one
// run read 59:49 next to a live shot of 48:00. Masking the digits keeps the icon,
// which is what the reader needs, and a real user never sees the jump because
// their clock and the server's agree.
//
// Second, and this one IS a product fault: **reloading a paused match resumes it.**
// The page decides on load that a match inside its own window should be running
// and posts `{status: "Live"}`, so a refresh un-pauses. Proved on staging - Paused
// before the reload, Live after it, three times. A reload was briefly this spec's
// fix for the first problem and was quietly undoing the state it meant to
// photograph. The article warns about it, and the test below asserts it.
//
// **Pausing is proved on the API.** The only thing that changes on screen is the
// icon inside the pill, and swapping one small glyph for another is not something
// to hang a spec on. `POST /status {"status":"Paused"}` is.

import { test, expect } from '@playwright/test';
import {
  shot, signInAs, onScreen, parkPointer,
  fixtures10, openMatch10, settled10, quiet10, afterKickOff,
  startMatchButton, endMatchButton, timerPill, timerFigures, matchPanel, matchEndedNotice,
  scoreStepper,
  sidebarIdentity10, moving10,
  KB10, KB10_TIMER_MINUTES,
} from '../../lib/kb';

/** The stepper row, which is absent for anybody who may not score. */
const stepperRow = (page: import('@playwright/test').Page) => page
  .locator('div[class*="rounded-full"][class*="border-blue-600"]')
  .filter({ has: page.locator('button.w-8.h-8') });

test.describe('10.3 Starting, pausing and ending a match', () => {
  test('the button before the whistle', async ({ page }) => {
    const fx = await fixtures10();
    await signInAs(page, KB10.pro, '/');
    await openMatch10(page, fx.scheduled, fx.frozenNow);

    const mask = [sidebarIdentity10(page, 'Mo KB'), ...moving10(page)];

    // 01 - START MATCH, photographed and not pressed. The card beside it says the
    // match will start on its own at the scheduled time, which is the other half
    // of what a reader needs to know.
    const start = startMatchButton(page);
    await expect(start).toBeVisible({ timeout: 30_000 });
    await expect(
      onScreen(page.getByText('This match will start automatically at the scheduled time and date.')).first(),
    ).toBeVisible();
    await parkPointer(page);
    await shot(page, '10.3', '01-start-match', { annotate: start, mask });

    // Proof the shot is honest: the fixture is still Scheduled afterwards.
    expect((await fx.detail(fx.scheduled)).status).toBe('Scheduled');
  });

  test('the timer, and pausing it', async ({ page }) => {
    const fx = await fixtures10();
    const t = await fx.throwaway('live');
    try {
      await signInAs(page, KB10.pro, '/');
      await openMatch10(page, t.id, afterKickOff(t.match, KB10_TIMER_MINUTES));

      const mask = [sidebarIdentity10(page, 'Mo KB'), ...moving10(page)];

      // The clock is frozen at kick-off plus twelve minutes, so a 60-minute match
      // reads 48:00. Asserted, because the article's first claim is that the timer
      // counts DOWN and this is where that is proved.
      const pill = timerPill(page);
      await expect(pill).toBeVisible({ timeout: 30_000 });
      await expect(pill).toHaveText(/^48:00$/);

      // 02 - the pill while the match is running.
      await parkPointer(page);
      await shot(page, '10.3', '02-timer-live', { annotate: pill, mask });

      // 03 - the same pill, paused. The pause icon becomes a play arrow, and
      // nothing else on the page changes at all.
      await pill.click();
      await expect
        .poll(async () => (await fx.detail(t.id))?.status, { timeout: 30_000 })
        .toBe('Paused');
      await parkPointer(page);
      await shot(page, '10.3', '03-paused', {
        annotate: timerPill(page),
        mask: [...mask, ...timerFigures(page)],
      });

      // The warning the article carries, proved rather than asserted from the
      // outside: a refresh puts the match back on. No click, no control - just a
      // reload, and the page posts {status: "Live"} because it decides a match
      // inside its own window should be running.
      await page.reload();
      await quiet10(page);
      await settled10(page);
      await expect
        .poll(async () => (await fx.detail(t.id))?.status, { timeout: 30_000 })
        .toBe('Live');
    } finally {
      expect(await fx.cancel(t.id), 'the throwaway must be cancelled').toBe(200);
    }
  });

  test('full time, and ending the match', async ({ page }) => {
    const fx = await fixtures10();
    // Never paused, so full time is exactly kick-off plus the duration.
    const t = await fx.throwaway('live');
    try {
      await signInAs(page, KB10.pro, '/');
      await openMatch10(page, t.id, afterKickOff(t.match, KB10_TIMER_MINUTES));

      const mask = [sidebarIdentity10(page, 'Mo KB'), ...moving10(page)];

      // A goal, so the finished card has a result to show rather than a 0-0.
      await (await scoreStepper(page, 'home', 'plus')).click();
      await expect
        .poll(async () => (await fx.detail(t.id))?.homeTeamTotalGoals, { timeout: 30_000 })
        .toBe(1);

      // 04 - full time. END MATCH replaces the timer, and nothing else on the page
      // says the match is over.
      expect((await fx.detail(t.id))?.pauseDurationSeconds ?? 0).toBe(0);
      await page.clock.setFixedTime(afterKickOff(t.match, 61));
      const end = endMatchButton(page);
      await expect(end).toBeVisible({ timeout: 30_000 });
      await expect(timerPill(page)).toHaveCount(0);
      await parkPointer(page);
      await shot(page, '10.3', '04-end-match', { annotate: end, mask });

      // 05 - ended. No confirmation is asked for: the click is the whole action.
      await end.click();
      await expect
        .poll(async () => (await fx.detail(t.id))?.status, { timeout: 30_000 })
        .toBe('Finished');
      await expect(matchEndedNotice(page)).toBeVisible({ timeout: 30_000 });
      // The steppers are gone too, which is what "cannot be edited" means in
      // practice.
      await expect(stepperRow(page)).toHaveCount(0);
      await settled10(page);
      await parkPointer(page);
      await shot(page, '10.3', '05-match-ended', {
        clip: matchPanel(page, 'match-details'), mask,
      });
    } finally {
      // A Finished match refuses to be reopened, not to be cancelled.
      expect(await fx.cancel(t.id), 'the ended throwaway must be cancelled').toBe(200);
    }
  });

  test('what a team player sees while the match is running', async ({ page }) => {
    const fx = await fixtures10();
    const t = await fx.throwaway('live');
    try {
      await signInAs(page, KB10.player, '/');
      await openMatch10(page, t.id, afterKickOff(t.match, KB10_TIMER_MINUTES));

      // 06 - the role half, and it is entirely an absence: no timer, no pause, no
      // steppers, no END MATCH. Pip is on KB 10 United and does not run it.
      await expect(timerPill(page)).toHaveCount(0);
      await expect(endMatchButton(page)).toHaveCount(0);
      await expect(startMatchButton(page)).toHaveCount(0);
      await expect(stepperRow(page)).toHaveCount(0);
      // The score is there, live, and read-only.
      await expect(onScreen(page.getByText(/^\d+ - \d+$/)).first()).toBeVisible();
      await settled10(page);
      await parkPointer(page);
      await shot(page, '10.3', '06-player-no-controls', {
        mask: [sidebarIdentity10(page, 'Pip KB'), ...moving10(page)],
      });
    } finally {
      expect(await fx.cancel(t.id), 'the Live throwaway must be cancelled').toBe(200);
    }
  });
});
