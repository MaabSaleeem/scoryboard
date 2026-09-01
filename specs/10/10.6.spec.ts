// 10.6 - Yellow and red cards, and how the final score is set.
//
// **Retitled.** The map called this "Cards, penalties and entering a final score",
// and two of those three do not exist on an ordinary match.
//
// There is no penalty control. `isPenalty` is read in the app bundle behind
// `tournamentMatchId`, next to the copy "Enter a deciding score for ... to proceed
// with the next round of the tournament" - it is how a drawn knockout tie is
// settled, and it is not on this page. And there is no typed final-score field
// either: `hasScoreEntry` belongs to the same tournament match card. The score of
// an ordinary match is the two `+` / `-` steppers, and a 0-0 ends as a **DRAW**
// with nothing asked. Confirmed by ending one on staging on 2026-09-01.
//
// So the article covers the cards in full, says where the final score comes from
// and when it locks, and states plainly that penalty shoot-outs live in a
// tournament. See briefs/10.md, point 5.
//
// Flagged `role`: only the Owner and a team Administrator have the card buttons.
// Stated in the article's first two lines and shown in 10.3's sixth screenshot.

import { test, expect } from '@playwright/test';
import {
  shot, signInAs, onScreen, parkPointer,
  fixtures10, openMatch10, afterKickOff, settled10,
  matchPanel, matchDialog10, closeDialog10, openFeedDialog, feedAction, matchEndedNotice,
  scoreText, sidebarIdentity10, moving10,
  KB10, KB10_TIMER_MINUTES, KB10_PLAYED_SCORE,
} from '../../lib/kb';

test.describe('10.6 Yellow and red cards, and how the final score is set', () => {
  test('booking a player, and sending one off', async ({ page }) => {
    const fx = await fixtures10();
    const t = await fx.throwaway('live');
    try {
      await signInAs(page, KB10.pro, '/');
      await openMatch10(page, t.id, afterKickOff(t.match, KB10_TIMER_MINUTES));

      const mask = [sidebarIdentity10(page, 'Mo KB'), ...moving10(page)];
      const feed = matchPanel(page, 'feed');
      const yellow = feedAction(page, 'Yellow Card');

      // 01 - the action bar. Four buttons, and two of them are this article's.
      await yellow.scrollIntoViewIfNeeded();
      const bar = yellow.locator('xpath=..');
      await expect(bar).toBeVisible();
      await parkPointer(page);
      await shot(page, '10.6', '01-action-bar', {
        clip: bar, clipPad: 20, annotate: yellow, mask,
      });

      // 02 - the Yellow Card window. Team first, then player: the team is marked
      // required and the player is not, which is worth knowing before you save.
      const yellowWin = await openFeedDialog(page, 'Yellow Card', 'Yellow Card');
      await expect(yellowWin.getByText('Select team', { exact: false }).first()).toBeVisible();
      await parkPointer(page);
      await shot(page, '10.6', '02-yellow-window', { clip: yellowWin, clipPad: 20, mask });

      // 03 - the player list, opened from inside the window.
      //
      // **The team has to be chosen first.** Select Player is `disabled` until it
      // is, which is why the window marks *Select team* with an asterisk and the
      // player field with nothing. The first run of this spec clicked straight at
      // the player field and waited out its whole timeout on a control that was
      // never going to become enabled. Choosing the AWAY side here on purpose:
      // booking an opponent is the case a reader is most likely to doubt.
      const picker = yellowWin.getByRole('button', { name: /Select Player/ }).first();
      await expect(picker).toBeDisabled();
      await yellowWin.getByRole('button', { name: /KB 10 Rovers/ }).first().click();
      await expect(picker).toBeEnabled({ timeout: 30_000 });
      await picker.click();
      const dara = onScreen(page.getByText('Dara KB', { exact: true })).last();
      await expect(dara).toBeVisible({ timeout: 30_000 });
      await parkPointer(page);
      await shot(page, '10.6', '03-choose-player', { mask });
      await dara.click();
      await yellowWin.getByRole('button', { name: 'Save' }).click();
      await expect(matchDialog10(page, 'Yellow Card')).toHaveCount(0, { timeout: 30_000 });

      // 04 - the card on the feed, with the yellow marker beside it.
      const yellowEntry = onScreen(feed.getByText(/issued Yellow Card to Dara KB/)).first();
      await expect(yellowEntry).toBeVisible({ timeout: 30_000 });
      await settled10(page);
      await parkPointer(page);
      await shot(page, '10.6', '04-yellow-on-feed', {
        clip: feed, annotate: yellowEntry, mask,
      });

      // 05 - the Red Card window. The same shape, and no extra confirmation for a
      // sending-off. Not annotated: the window is the subject and the button
      // behind it is under the overlay.
      const redWin = await openFeedDialog(page, 'Red Card', 'Red Card');
      await parkPointer(page);
      await shot(page, '10.6', '05-red-window', { clip: redWin, clipPad: 20, mask });

      const redPicker = redWin.getByRole('button', { name: /Select Player/ }).first();
      await redWin.getByRole('button', { name: /KB 10 Rovers/ }).first().click();
      await expect(redPicker).toBeEnabled({ timeout: 30_000 });
      await redPicker.click();
      const cleo = onScreen(page.getByText('Cleo KB', { exact: true })).last();
      await expect(cleo).toBeVisible({ timeout: 30_000 });
      await cleo.click();
      await redWin.getByRole('button', { name: 'Save' }).click();
      await expect(matchDialog10(page, 'Red Card')).toHaveCount(0, { timeout: 30_000 });

      // 06 - both cards on one feed, so the reader can tell the two markers apart.
      const redEntry = onScreen(feed.getByText(/issued Red Card to Cleo KB/)).first();
      await expect(redEntry).toBeVisible({ timeout: 30_000 });
      await expect(yellowEntry).toBeVisible();
      await settled10(page);
      await parkPointer(page);
      await shot(page, '10.6', '06-red-on-feed', {
        clip: feed, annotate: redEntry, mask,
      });

      // A card does not touch the score. Asserted because the article says the
      // score is the steppers and nothing else.
      await expect(scoreText(page)).toHaveText('0 - 0');
    } finally {
      expect(await fx.cancel(t.id), 'the throwaway must be cancelled').toBe(200);
    }
  });

  test('the final score, once the match is over', async ({ page }) => {
    const fx = await fixtures10();
    await signInAs(page, KB10.pro, '/');
    await openMatch10(page, fx.played, fx.frozenNow);

    // 07 - the played fixture. The winner gets a trophy, the card reads WIN, and
    // the notice underneath is the article's last line: the score is whatever the
    // steppers said at full time and it cannot be changed afterwards.
    await expect(scoreText(page))
      .toHaveText(`${KB10_PLAYED_SCORE.home} - ${KB10_PLAYED_SCORE.away}`);
    await expect(matchEndedNotice(page)).toBeVisible({ timeout: 30_000 });
    // There is no stepper and no score field. Both halves of the retitle, proved.
    await expect(page.locator('div[class*="rounded-full"][class*="border-blue-600"]')
      .filter({ has: page.locator('button.w-8.h-8') })).toHaveCount(0);
    await expect(onScreen(page.getByText(/penalt/i))).toHaveCount(0);
    await settled10(page);
    await parkPointer(page);
    await shot(page, '10.6', '07-final-score', {
      clip: matchPanel(page, 'match-details'),
      mask: [sidebarIdentity10(page, 'Mo KB'), ...moving10(page)],
    });
  });
});
