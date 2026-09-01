// 15.5 - Running the slideshow on a venue screen.
//
// Fixtures: KB 15 Cup, which has a saved slide show, and KB 15 League, which has
// none - so the empty state is a second fixture rather than something this spec
// breaks.
//
// The show is opened WITHOUT a session, because that is what a venue screen is:
// a browser on a television that nobody has signed in on. It works, which is the
// article's headline.
//
// Two things about the clock, both in `openSlideshow`:
//
// - the show renders a live wall clock, so the clock is pinned with
//   `setFixedTime` - otherwise the capture differs by a second every run;
// - the show turns its own slides and `clock.install()` plus `runFor()` does NOT
//   move them (measured: 41 seconds of fake time, still slide 1). So the second
//   slide is waited for as a CONDITION, on the real timer, which is what
//   docs/style-guide.md asks for. One cycle of this show is 60 seconds, hence the
//   long timeout inside `slideOnScreen`.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures15, freezeClock15, centre, onScreen,
  board15Ready, presentationSubTab, publicContext, openSlideshow, slideOnScreen,
  slideshowClock,
} from '../../lib/kb';

test.describe('15.5 Running the slideshow on a venue screen', () => {
  test('the control that opens it, two slides, and a tournament with none',
    async ({ page, browser }) => {
      const fx = await fixtures15();

      // Where the reader starts: the button on their own board.
      await signInAs(page, fx.email, `/tournaments/${fx.cup}/presentation`);
      await freezeClock15(page);
      await quiet(page);
      await board15Ready(page, onScreen(page.getByText('Public tabs', { exact: true })).first());
      await presentationSubTab(page, 'Slideshow');

      const open = page.getByRole('button', { name: 'Open Fullscreen', exact: true });
      await expect(open).toBeVisible({ timeout: 30_000 });
      await centre(open);
      // Not clicked: it opens a second tab, and the next captures go to the same
      // address in a context that has never signed in, which is the honest
      // picture of a screen at a venue.
      await shot(page, '15.5', '01-open-fullscreen', {
        mask: [page.getByText('Oona KB', { exact: true })],
        annotate: open,
      });

      const ctx = await publicContext(browser);
      const screen = await ctx.newPage();
      try {
        await openSlideshow(screen, fx.cup);
        // Slide one: the welcome line and the QR code that sends a spectator to
        // the public page.
        await slideOnScreen(screen, screen.getByText('Welcome to KB 15 Cup. Kick-off 10:00.'));
        await expect(screen.getByText('Follow this tournament')).toBeVisible();
        await shot(screen, '15.5', '02-slide-welcome', {
          mask: [slideshowClock(screen)],
        });

        // The show turns itself. Waiting for the group table to arrive is the
        // proof, and it is a condition rather than a sleep.
        await slideOnScreen(screen, onScreen(screen.getByText(/^group a$/i)).first());
        await shot(screen, '15.5', '03-slide-group-table', {
          mask: [slideshowClock(screen)],
        });

        // A tournament with no saved show says so rather than showing a blank
        // screen - which is what a reader who has not pressed Save will meet.
        await openSlideshow(screen, fx.league).catch(async () => {
          // No "Powered by Scoryboard" on the empty screen, so openSlideshow's own
          // gate does not apply here. Fall through to the empty-state assertion.
          await screen.goto(`/tournament/${fx.league}/slideshow`);
        });
        await expect(screen.getByText('No active slides available.')).toBeVisible({
          timeout: 30_000,
        });
        await quiet(screen);
        await shot(screen, '15.5', '04-no-active-slides');
      } finally {
        await ctx.close();
      }
    });
});
