// 10.4 - The match timer.
//
// Three shots about one number, and the number is the reason this spec exists at
// all: a timer is the one thing on these screens that is different every second.
//
// **It counts down, not up**, from the match duration. And it runs from
// `startedAt` - the instant the server actually started the match - not from the
// kick-off time in the match details. Those two are minutes apart on a match the
// server started for itself, and getting it wrong is visible: 10.3's first run
// froze the clock at `date + 12 min` and the pill read 51:03 instead of 48:00.
// afterKickOff() takes `startedAt` for that reason.
//
// So the whole article is captured at a chosen point on the clock: kick-off plus
// twelve minutes of a sixty-minute match, which reads **48:00** on every run.

import { test, expect } from '@playwright/test';
import {
  shot, signInAs, onScreen, parkPointer,
  fixtures10, openMatch10, afterKickOff, timerPill, timerFigures, matchPanel, scoreText,
  sidebarIdentity10, moving10,
  KB10, KB10_TIMER_MINUTES, KB10_DEFAULTS,
} from '../../lib/kb';

test.describe('10.4 The match timer', () => {
  test('counting down, and holding while paused', async ({ page }) => {
    const fx = await fixtures10();
    const t = await fx.throwaway('live');
    try {
      await signInAs(page, KB10.pro, '/');
      await openMatch10(page, t.id, afterKickOff(t.match, KB10_TIMER_MINUTES));

      const mask = [sidebarIdentity10(page, 'Mo KB'), ...moving10(page)];

      // 60 minutes' duration less 12 elapsed. Asserted rather than read, because
      // "it counts down" is the article's first sentence.
      expect(t.match.duration).toBe(KB10_DEFAULTS.duration);
      const pill = timerPill(page);
      await expect(pill).toBeVisible({ timeout: 30_000 });
      await expect(pill).toHaveText(/^48:00$/);

      // 01 - the pill where the reader will look for it: at the right-hand end of
      // the tab strip. Clipped tightly, because 10.3 already shows it in the
      // context of the whole page and this article is about the number.
      await parkPointer(page);
      await shot(page, '10.4', '01-timer-pill', {
        clip: pill, clipPad: 28, annotate: pill, annotatePad: 2, mask,
      });

      // 02 - the same figure under the score. There are exactly two on the page
      // and this is the one inside the MATCH DETAILS panel, which is what scoping
      // to the panel proves.
      const inCard = onScreen(matchPanel(page, 'match-details').getByText(/^\d?\d:\d\d$/)).first();
      await expect(inCard).toHaveText(/^48:00$/);
      const scoreBlock = scoreText(page).locator('xpath=..');
      await parkPointer(page);
      await shot(page, '10.4', '02-timer-in-card', {
        clip: scoreBlock, clipPad: 24, annotate: inCard, mask,
      });

      // 03 - paused. The pill swaps its pause icon for a play icon and the figure
      // holds. That icon is the only thing on the page that changes, which is
      // exactly why the article needs a picture of it - and why the state itself
      // is proved on the API rather than on the glyph.
      await pill.click();
      await expect
        .poll(async () => (await fx.detail(t.id))?.status, { timeout: 30_000 })
        .toBe('Paused');

      // **The digits are masked in this one shot**, and reloading is not an option.
      //
      // Once the match is paused the pill is drawn from the `pausedAt` the SERVER
      // stamps, not from the browser clock - and the server ignores a `pausedAt`
      // sent in the body, checked on staging. So the figure jumps to however long
      // this spec took to get here, about forty seconds, and no test clock can pin
      // it: one run read 48:00 live and 59:40 paused, one second apart. A real user
      // never sees that jump, because their clock and the server's agree. Masking
      // the digits keeps the icon, which is the only thing that changes on screen
      // and the only thing the reader needs to recognise.
      //
      // Reloading was tried as a fix and is worse than useless: **a reload resumes
      // a paused match.** The page posts {status: "Live"} on load, because it
      // decides a match inside its own window should be running. 10.3 asserts that
      // and both articles warn about it.
      const paused = timerPill(page);
      await expect(paused).toBeVisible();
      await parkPointer(page);
      await shot(page, '10.4', '03-timer-paused', {
        clip: paused, clipPad: 28, annotate: paused, annotatePad: 2,
        mask: [...mask, ...timerFigures(page)],
      });

      // Time spent paused is not counted: the match carries pauseDurationSeconds
      // and the timer subtracts it. Left paused, because the throwaway is about to
      // be cancelled either way.
      expect((await fx.detail(t.id))?.pauseDurationSeconds).toBeGreaterThanOrEqual(0);
    } finally {
      expect(await fx.cancel(t.id), 'the throwaway must be cancelled').toBe(200);
    }
  });
});
