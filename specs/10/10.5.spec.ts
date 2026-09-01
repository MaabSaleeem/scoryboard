// 10.5 - Awarding a goal, and revoking one entered by mistake.
//
// The surprise here is how little the `+` asks for. It awards a goal on the click
// - `POST /events {teamId, teamType, type: "GoalAwarded"}`, no player, no dialog,
// no confirmation - and the feed then reads "Mo awarded a goal" with a
// **+ Add Player** link beside it. The scorer and the assist are attached
// afterwards, in an **Edit Goal** window. A reader who expects to be asked who
// scored will not be, and that is the article's first paragraph.
//
// `-` is the mirror image: the original entry is marked **Revoked** and stamped
// **Edited**, a second entry reads "Mo revoked the goal", and the score comes back
// down. The `-` button is `disabled` at zero, which is also how this spec knows a
// goal has landed without reading the score.
//
// Flagged `role`. Only the Owner and a team Administrator have the steppers; a
// team player and an assigned referee do not. That is stated in the article's
// first two lines and shown in 10.3's sixth screenshot, which this article links
// to - all six shots here are needed for the goal itself.
//
// Everything happens on a throwaway. The fixture is Finished and permanent, and
// the Scheduled fixture has no steppers at all.

import { test, expect } from '@playwright/test';
import {
  shot, signInAs, onScreen, parkPointer,
  fixtures10, openMatch10, afterKickOff, settled10,
  matchPanel, matchDialog10, closeDialog10, scoreStepper, scoreStepperRow, scoreText,
  sidebarIdentity10, moving10,
  KB10, KB10_TIMER_MINUTES,
} from '../../lib/kb';

test.describe('10.5 Awarding a goal, and revoking one entered by mistake', () => {
  test('the stepper, the scorer and the revoke', async ({ page }) => {
    const fx = await fixtures10();
    const t = await fx.throwaway('live');
    try {
      await signInAs(page, KB10.pro, '/');
      await openMatch10(page, t.id, afterKickOff(t.match, KB10_TIMER_MINUTES));

      const mask = [sidebarIdentity10(page, 'Mo KB'), ...moving10(page)];
      const feed = matchPanel(page, 'feed');

      const row = await scoreStepperRow(page);
      const homePlus = await scoreStepper(page, 'home', 'plus');
      const homeMinus = await scoreStepper(page, 'home', 'minus');

      // Nothing has been scored, so taking a goal away is not offered. Asserted
      // because it is the clearest thing the article can tell a reader who is
      // looking for an undo.
      await expect(homeMinus).toBeDisabled();
      await expect(scoreText(page)).toHaveText('0 - 0');

      // 01 - the two steppers. Left is the home team, right is the away team.
      await parkPointer(page);
      await shot(page, '10.5', '01-steppers', {
        clip: row, clipPad: 26, annotate: homePlus, annotatePad: 2, mask,
      });

      // 02 - one press, and the goal is already on the feed with nobody's name
      // against it.
      await homePlus.click();
      await expect
        .poll(async () => (await fx.detail(t.id))?.homeTeamTotalGoals, { timeout: 30_000 })
        .toBe(1);
      await expect(scoreText(page)).toHaveText('1 - 0');
      const unnamed = onScreen(feed.getByText(/awarded a goal/)).first();
      await expect(unnamed).toBeVisible({ timeout: 30_000 });
      const addPlayer = onScreen(feed.getByText('+ Add Player', { exact: true })).first();
      await expect(addPlayer).toBeVisible();
      await settled10(page);
      await parkPointer(page);
      await shot(page, '10.5', '02-goal-awarded', {
        clip: feed, annotate: addPlayer, mask,
      });

      // 03 - the Edit Goal window. Its heading says Edit, not Add, even though
      // nothing has been set yet.
      await addPlayer.click();
      const dlg = matchDialog10(page, 'Edit Goal').first();
      await expect(dlg).toBeVisible({ timeout: 30_000 });
      await expect(dlg.getByText('Scored', { exact: true })).toBeVisible();
      await expect(dlg.getByText('Assist', { exact: true })).toBeVisible();
      await parkPointer(page);
      await shot(page, '10.5', '03-edit-goal', { clip: dlg, clipPad: 20, mask });

      // 04 - the list of who can be credited. It is the line-up, not the squad.
      const scored = dlg.getByRole('button', { name: /Scored/ }).first();
      await scored.click();
      const option = onScreen(page.getByText('Sol KB', { exact: true })).last();
      await expect(option).toBeVisible({ timeout: 30_000 });
      await parkPointer(page);
      await shot(page, '10.5', '04-choose-scorer', { mask });
      await option.click();

      // The assist as well, so shot 05 shows both halves of what the window does.
      const assist = dlg.getByRole('button', { name: /Assist/ }).first();
      await assist.click();
      const assister = onScreen(page.getByText('Nia KB', { exact: true })).last();
      await expect(assister).toBeVisible({ timeout: 30_000 });
      await assister.click();

      await dlg.getByRole('button', { name: 'Save' }).click();
      await expect(matchDialog10(page, 'Edit Goal')).toHaveCount(0, { timeout: 30_000 });

      // 05 - the same entry, now naming the scorer and the assist.
      const named = onScreen(feed.getByText(/awarded goal to Sol KB/)).first();
      await expect(onScreen(feed.getByText(/assisted by Nia KB/)).first()).toBeVisible({ timeout: 30_000 });
      await expect(named).toBeVisible({ timeout: 30_000 });
      await settled10(page);
      await parkPointer(page);
      await shot(page, '10.5', '05-goal-with-scorer', {
        clip: feed, annotate: named, mask,
      });

      // 06 - revoked. Two entries, not one: the goal is struck through and marked
      // Revoked, and a second line records the revoke. The score goes back down.
      const minus = await scoreStepper(page, 'home', 'minus');
      await expect(minus).toBeEnabled();
      await minus.click();
      await expect
        .poll(async () => (await fx.detail(t.id))?.homeTeamTotalGoals, { timeout: 30_000 })
        .toBe(0);
      await expect(scoreText(page)).toHaveText('0 - 0');
      const revoked = onScreen(feed.getByText('Revoked', { exact: true })).first();
      await expect(revoked).toBeVisible({ timeout: 30_000 });
      await expect(onScreen(feed.getByText(/revoked the goal/)).first()).toBeVisible();
      await settled10(page);
      await parkPointer(page);
      await shot(page, '10.5', '06-goal-revoked', {
        clip: feed, annotate: revoked, mask,
      });
    } finally {
      expect(await fx.cancel(t.id), 'the throwaway must be cancelled').toBe(200);
    }
  });
});
