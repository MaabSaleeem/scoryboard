// 10.9 - Recording a match that has already been played.
//
// One rule decides everything in this article, and it was measured rather than
// guessed: **a match is created already finished if it would have ended more than
// 24 hours ago.** Inside that window the app starts it for you and you enter the
// score as normal; outside it, the row arrives `Finished`, `autoFinished: true`,
// `0-0`, and nothing can ever be written to it.
//
// Measured on staging 2026-09-01, one match at a time. With a 60-minute duration:
// 24h ago Live, 24.75h ago Live, 25.13h ago Finished. With 120 minutes: 25.5h ago
// Live, 26.5h ago Finished. With 90 minutes: 24.5h ago Live, 26h ago Finished.
// Take the duration off each and the boundary is the same in all three - ended
// more than 24 hours ago. See config/api.md.
//
// **The date picker disables nothing.** Every day is selectable, past days
// included, and it opens on the current month with the previous month one control
// away. Nothing in the form warns about the 24-hour rule, which is why the article
// exists.
//
// The clock for shots 01 and 02 is deliberately NOT `fx.frozenNow`. The played
// fixture is dated the day the seed ran, so frozenNow lands on the 1st of a month
// and the picker then shows a calendar with no past days in it - the exact thing
// the article needs to show. Freezing to the 20th of the same month gives a
// calendar with a past half and a future half, which is what a reader sees on
// nineteen days out of twenty.

import { test, expect } from '@playwright/test';
import {
  shot, signInAs, onScreen, parkPointer,
  fixtures10, openMatch10, afterKickOff, settled10,
  matchPanel, timerPill, matchEndedNotice, scoreText,
  sidebarIdentity10, moving10,
  KB10, KB10_TIMER_MINUTES,
} from '../../lib/kb';

/** The 20th of whatever month the fixture sits in, at noon. Derived, not written. */
function midMonth(from: Date) {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 20, 12, 0, 0));
}

/**
 * A day in the open date picker.
 *
 * `data-day="dd/MM/yyyy"` is the handle. Not the accessible name, which is the
 * whole date spelled out - "Saturday, September 5th, 2026" - so
 * `getByRole('button', {name: '12'})` finds nothing and waits out its timeout.
 * That cost 10.9 a run.
 */
function dayCell10(page: import('@playwright/test').Page, when: Date, day: number) {
  const dd = String(day).padStart(2, '0');
  const mm = String(when.getUTCMonth() + 1).padStart(2, '0');
  return page.locator(`button[data-day="${dd}/${mm}/${when.getUTCFullYear()}"]`);
}

test.describe('10.9 Recording a match that has already been played', () => {
  test('the date field, and what the picker allows', async ({ page }) => {
    const fx = await fixtures10();
    // A blank Incomplete match, exactly as Create Match makes one. The editable
    // MATCH DETAILS form exists only while a match is Incomplete, so this is the
    // only state the form can be photographed in.
    const blank = await fx.blank();
    try {
      await signInAs(page, KB10.pro, '/');
      await openMatch10(page, blank, midMonth(fx.frozenNow));

      const mask = [sidebarIdentity10(page, 'Mo KB'), ...moving10(page)];
      const form = page.locator('form').filter({ has: page.getByRole('button', { name: 'Save changes' }) }).first();
      await expect(form).toBeVisible({ timeout: 30_000 });

      // 01 - the form. Date is one field among seven, and nothing beside it says
      // anything about how far back it may go.
      const dateButton = form.getByRole('button', { name: 'Select date' }).first();
      await expect(dateButton).toBeVisible();
      await parkPointer(page);
      await shot(page, '10.9', '01-match-details-form', {
        clip: form, clipPad: 8, annotate: dateButton, mask,
      });

      // 02 - the picker. Today is the 20th, so days 1 to 19 are in the past and
      // every one of them is selectable: none carries `disabled` and none carries
      // `aria-disabled`. Asserted on the 12th, which is also the day the shot
      // outlines.
      await dateButton.click();
      const when = midMonth(fx.frozenNow);
      const past = onScreen(dayCell10(page, when, 12)).first();
      await expect(past).toBeVisible({ timeout: 30_000 });
      await expect(past).toBeEnabled();
      await expect(past).not.toHaveAttribute('aria-disabled', 'true');
      // And so is a future day, so the shot is not a calendar that only looks
      // backwards.
      await expect(onScreen(dayCell10(page, when, 25)).first()).toBeEnabled();
      // The strongest form of the claim: NOTHING in the month is disabled. This is
      // the assertion that would fail the day the app starts guarding the field,
      // which is exactly when this article would need rewriting.
      await expect(page.locator('button[data-day][disabled]')).toHaveCount(0);
      await parkPointer(page);
      await shot(page, '10.9', '02-date-picker', { annotate: past, mask });
    } finally {
      expect(await fx.cancel(blank), 'the blank match must be cancelled').toBe(200);
    }
  });

  test('a match played earlier today starts itself', async ({ page }) => {
    const fx = await fixtures10();
    const t = await fx.throwaway('live');
    try {
      // Built through the real auto-start rather than POST /status {Live}, because
      // the SystemEvent shot 04 is about only appears when the server starts a
      // match for itself.
      expect(t.match.autoStarted).toBe(true);

      await signInAs(page, KB10.pro, '/');
      await openMatch10(page, t.id, afterKickOff(t.match, KB10_TIMER_MINUTES));

      const mask = [sidebarIdentity10(page, 'Mo KB'), ...moving10(page)];

      // 03 - saved with a time earlier today, and already running. No whistle was
      // blown: START MATCH never appeared.
      await expect(timerPill(page)).toBeVisible({ timeout: 30_000 });
      await expect(scoreText(page)).toHaveText('0 - 0');
      await settled10(page);
      await parkPointer(page);
      await shot(page, '10.9', '03-started-itself', {
        clip: matchPanel(page, 'match-details'), annotate: timerPill(page), mask,
      });

      // 04 - the feed says so in its own words. This is a `SystemEvent`, the one
      // kind of entry nobody writes.
      const system = onScreen(
        matchPanel(page, 'feed').getByText('Match was created from the past date', { exact: true }),
      ).first();
      await expect(system).toBeVisible({ timeout: 30_000 });
      await settled10(page);
      await parkPointer(page);
      await shot(page, '10.9', '04-system-event', {
        clip: matchPanel(page, 'feed'), annotate: system, mask,
      });
    } finally {
      expect(await fx.cancel(t.id), 'the throwaway must be cancelled').toBe(200);
    }
  });

  test('a match that ended more than a day ago cannot be scored', async ({ page }) => {
    const fx = await fixtures10();
    // Dated thirty hours back with a sixty-minute duration, so it ended
    // twenty-nine hours ago - the wrong side of the boundary.
    const t = await fx.throwaway('stale');
    try {
      expect(t.match.status).toBe('Finished');
      expect(t.match.autoFinished).toBe(true);
      expect(t.match.homeTeamTotalGoals).toBe(0);
      expect(t.match.awayTeamTotalGoals).toBe(0);

      await signInAs(page, KB10.pro, '/');
      await openMatch10(page, t.id, fx.frozenNow);

      // 05 - the warning the article exists for. The match is over before anybody
      // has touched it: no steppers, no timer, nothing to enter, and the notice
      // says it cannot be edited.
      await expect(scoreText(page)).toHaveText('0 - 0');
      await expect(matchEndedNotice(page)).toBeVisible({ timeout: 30_000 });
      await expect(timerPill(page)).toHaveCount(0);
      await expect(page.locator('div[class*="rounded-full"][class*="border-blue-600"]')
        .filter({ has: page.locator('button.w-8.h-8') })).toHaveCount(0);
      await settled10(page);
      await parkPointer(page);
      await shot(page, '10.9', '05-too-old', {
        clip: matchPanel(page, 'match-details'),
        mask: [sidebarIdentity10(page, 'Mo KB'), ...moving10(page)],
      });
    } finally {
      // A Finished match refuses to be reopened, not to be cancelled.
      expect(await fx.cancel(t.id), 'the stale throwaway must be cancelled').toBe(200);
    }
  });
});
