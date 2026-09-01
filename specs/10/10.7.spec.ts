// 10.7 - Choosing Player of the Match.
//
// A feed action like the cards, with the same two-field window - team, then
// player - and one thing worth saying out loud: **it can be set while the match is
// still running.** Nothing waits for full time, and nothing stops it being set
// again while the match is live.
//
// The feed draws the choice differently from every other entry: its own centred
// block headed "Player of the match", with the player's avatar under it and a
// laurel marker. That marker is one of the eleven on the KEYS panel, which is
// where a reader who has not read 10.1 will go looking for it.
//
// Flagged `role`: the Owner and a team Administrator only. Stated in the article's
// first two lines and shown in 10.3's sixth screenshot.

import { test, expect } from '@playwright/test';
import {
  shot, signInAs, onScreen, parkPointer, centre,
  fixtures10, openMatch10, afterKickOff, settled10,
  matchPanel, openFeedDialog, feedAction,
  sidebarIdentity10, moving10,
  KB10, KB10_TIMER_MINUTES,
} from '../../lib/kb';

test.describe('10.7 Choosing Player of the Match', () => {
  test('the button and the window', async ({ page }) => {
    const fx = await fixtures10();
    const t = await fx.throwaway('live');
    try {
      await signInAs(page, KB10.pro, '/');
      await openMatch10(page, t.id, afterKickOff(t.match, KB10_TIMER_MINUTES));

      const mask = [sidebarIdentity10(page, 'Mo KB'), ...moving10(page)];
      const potm = feedAction(page, 'Player of Match');

      // 01 - where the control is. Third of the four buttons under the feed, and
      // the only one that is not about something going wrong.
      await potm.scrollIntoViewIfNeeded();
      const bar = potm.locator('xpath=..');
      await expect(bar).toBeVisible();
      await parkPointer(page);
      await shot(page, '10.7', '01-potm-button', {
        clip: bar, clipPad: 20, annotate: potm, mask,
      });

      // 02 - the window. Its heading is "Player Of Match", which is not what the
      // button says and not what the feed calls it either - three spellings of one
      // thing, so the article uses the app's own words in each place.
      const win = await openFeedDialog(page, 'Player of Match', 'Player Of Match');
      await expect(win.getByRole('button', { name: /Select Player/ }).first()).toBeVisible();
      await parkPointer(page);
      await shot(page, '10.7', '02-potm-window', { clip: win, clipPad: 20, mask });
    } finally {
      expect(await fx.cancel(t.id), 'the throwaway must be cancelled').toBe(200);
    }
  });

  test('the choice on the feed', async ({ page }) => {
    const fx = await fixtures10();
    await signInAs(page, KB10.pro, '/');
    await openMatch10(page, fx.played, fx.frozenNow);

    // 03 - the played fixture's feed. The block is centred and headed "Player of
    // the match", which is a third spelling again.
    //
    // A viewport capture centred on the block rather than a clip: the block has no
    // container of its own that holds the heading, the name and the avatar
    // together, and clipping the whole feed would bury a three-line answer in a
    // 1,200-pixel picture.
    const heading = onScreen(
      matchPanel(page, 'feed').getByText('Player of the match', { exact: true }),
    ).first();
    await expect(heading).toBeVisible({ timeout: 30_000 });
    await centre(heading);
    await settled10(page);
    await parkPointer(page);
    await shot(page, '10.7', '03-potm-on-feed', {
      annotate: heading,
      mask: [sidebarIdentity10(page, 'Mo KB'), ...moving10(page)],
    });
  });
});
