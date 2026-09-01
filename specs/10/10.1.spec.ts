// 10.1 - The match screen, its tabs and the guided tour.
//
// A tour of one page. The match screen is six panels stacked on top of each
// other, and the tab strip scrolls to anchors rather than swapping content - so
// every panel is in the DOM at once and can be clipped without being clicked.
//
// Two things this spec is careful about.
//
// **KEYS is a sixth tab.** Collection 09 recorded five. There are six, and the
// sixth is a legend of eleven markers that the other panels each link to with a
// VIEW KEYS button. It is worth its own capture because nothing else in the
// product explains those markers.
//
// **The tour writes to the account.** It is Shepherd.js, three steps, and both
// **Skip Tour** and **Finish** fire `PUT /users/:id {isTourCompleted: true}` -
// a full replace, which clears the account's bio as a side effect (config/api.md,
// verified on staging 2026-09-01 by reading Mo's bio, pressing Finish, and
// reading "" back). So this spec closes the tour with its `x` and restores the
// whole profile in a `finally` anyway. No exit can be trusted not to write.

import { test, expect } from '@playwright/test';
import {
  shot, signInAs, onScreen, parkPointer,
  fixtures10, openMatch10, settled10, matchPanel, tabStrip10, matchTab10,
  showTourButton, tourStepReady, tourNext, closeTour, keysPanelReady,
  sidebarIdentity10, moving10,
  KB10, KB10_TEAMS, KB10_VENUE, KB10_LEADERBOARD,
} from '../../lib/kb';

test.describe('10.1 The match screen, its tabs and the guided tour', () => {
  test('the six panels and the three-step tour', async ({ page }) => {
    const fx = await fixtures10();

    try {
      await signInAs(page, KB10.pro, '/');
      await openMatch10(page, fx.scheduled, fx.frozenNow);

      const mask = [sidebarIdentity10(page, 'Mo KB'), ...moving10(page)];

      // The owner's heading. Asserted rather than assumed: it is the role tell,
      // and a reader who is not the Owner or an Administrator gets
      // "Match Preview (View Only)" instead (config/api.md).
      await expect(onScreen(page.getByText('Match Settings', { exact: true })).first())
        .toBeVisible({ timeout: 30_000 });
      // The venue proves the store slice warm10() fills has landed. Cold, this
      // reads "Location not set" over data the API returns perfectly.
      await expect(page.getByText(KB10_VENUE.name, { exact: true }).first()).toBeVisible();

      // 01 - the whole screen as it opens. The heading, the tabs, START MATCH,
      // the score, the countdown and the details row all fit one viewport at
      // 1440x900, so this is the only full-viewport capture in the article.
      await parkPointer(page);
      await shot(page, '10.1', '01-match-screen', { mask });

      // 02 - the tab strip. Six tabs, and KEYS is the one worth pointing at.
      const strip = await tabStrip10(page);
      const keys = matchTab10(page, 'KEYS');
      await expect(keys).toBeVisible();
      await parkPointer(page);
      await shot(page, '10.1', '02-tab-strip', {
        clip: strip, clipPad: 12, annotate: keys, mask,
      });

      // 03 to 06 - one clip per panel. Every panel is present without clicking a
      // tab, which is why these are clips and not four navigations.
      await parkPointer(page);
      await shot(page, '10.1', '03-feed-panel', { clip: matchPanel(page, 'feed'), mask });

      await expect(matchPanel(page, 'facts').getByText('Insights', { exact: true }).first())
        .toBeVisible({ timeout: 30_000 });
      await expect(matchPanel(page, 'facts').getByText(KB10_LEADERBOARD, { exact: true }).first())
        .toBeVisible();
      await parkPointer(page);
      await shot(page, '10.1', '04-facts-panel', { clip: matchPanel(page, 'facts'), mask });

      // Both pitches must have drawn all five starters. A line-up position that
      // repeats has to carry its index - two players on plain "CenterBack"
      // collide and the pitch draws an empty slot for each and neither player.
      // This assertion is what would catch that regression.
      const lineup = matchPanel(page, 'lineup');
      for (const name of ['Mo', 'Nia KB', 'Sol KB', 'Raj KB', 'Eve KB']) {
        await expect(lineup.getByText(name, { exact: true }).first()).toBeVisible();
      }
      await expect(lineup.getByText(KB10_TEAMS.rovers, { exact: true }).first()).toBeVisible();
      await parkPointer(page);
      await shot(page, '10.1', '05-lineup-panel', { clip: lineup, mask });

      // keysPanelReady() and not a bare clip: the panel is a collapsible whose
      // body opens a render after the page settles, and the first run of this
      // spec caught it shut - an 83-pixel strip with the header and the top edge
      // of four pills. See the helper.
      const keysPanel = await keysPanelReady(page);
      for (const marker of ['Player Online', 'Spectator', 'Referee', 'Player Of The Match', 'Captain']) {
        await expect(keysPanel.getByText(marker, { exact: true }).first()).toBeVisible();
      }
      await parkPointer(page);
      await shot(page, '10.1', '06-keys-panel', { clip: keysPanel, mask });

      // 07 to 09 - the tour. Three steps, targeting MATCH DETAILS, FEED and
      // LINEUP; it covers neither FACTS, nor PAYMENT, nor KEYS.
      //
      // Full-viewport captures on purpose: the dialog is portalled and floats
      // over the panel it is describing, and clipping to either one would lose
      // the relationship the shot exists to show.
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(showTourButton(page)).toBeVisible();
      await showTourButton(page).click();

      const step1 = await tourStepReady(page, 'match-details-section');
      await expect(step1.getByText('Skip Tour', { exact: true })).toBeVisible();
      await parkPointer(page);
      await shot(page, '10.1', '07-tour-details', {
        annotate: showTourButton(page), mask,
      });

      await tourNext(page);
      const step2 = await tourStepReady(page, 'feed-section');
      await expect(step2.getByText('Back', { exact: true })).toBeVisible();
      await parkPointer(page);
      await shot(page, '10.1', '08-tour-feed', { mask });

      await tourNext(page);
      const step3 = await tourStepReady(page, 'lineup-section');
      // The third step's primary button reads Finish, not Next. That is the tell
      // that the tour is three steps long and not more.
      await expect(step3.getByText('Finish', { exact: true })).toBeVisible();
      await parkPointer(page);
      await shot(page, '10.1', '09-tour-lineup', { mask });

      // Closed with the x, never with Finish. See the note at the top.
      await closeTour(page);
      await settled10(page);
    } finally {
      // Unconditional. If the tour wrote isTourCompleted and cleared the bio,
      // this puts the whole profile back; if it did not, this is a no-op that
      // the seed would report as zero writes.
      expect(await fx.restoreProfile('pro'), 'Mo profile restored').toBe(200);
    }
  });
});
