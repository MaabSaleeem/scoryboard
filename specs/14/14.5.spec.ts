// 14.5 - Rescheduling fixtures, and rolling them onto the next day.
//
// Fixture: KB 14 League, re-timed here and restored at the end because 14.3
// photographs the same group.
//
// RETITLED. The map calls this "Rescheduling, rolling and deleting fixtures".
// There is no way to delete a fixture: the Schedule tab's cards carry no menu,
// and the match page they link to is "Match Preview (View Only)". The app does
// have DELETE /matches/:id behind a "Cancel Match" action, but that action is on
// the general match card used elsewhere in the product, not on a tournament
// fixture. See briefs/14.md, "What the map got wrong".
//
// What is left is two ways to move a fixture and one way to spread a whole
// group across days:
//   - the four cells on a fixture card - date, time, pitch, referee - each
//     editable in place, sending PUT /matches/:id
//   - SELECT MATCH TO UPDATE, which sends the same bulk payload with match ids
//   - the dialog's cutoff field, which rolls whatever will not fit onto the
//     next day
//
// CHANGED 2026-09-08 - see 8sept-updates.md A2 and briefs/14.md, 14.5.
// "Last allowed match start time" no longer exists anywhere in the product. Two
// things replaced it, and they are NOT the same change:
//
//   1. Where a cutoff survives it is called `End time`, and its help text is
//      "If the next match would finish past this time, scheduling moves to the
//      next day." It counts the WHOLE match, not just its start.
//   2. On a Round Robin tournament the field is gone entirely. KB 14 League's
//      Bulk Match Updates dialog has no cutoff of any kind.
//
// So shots 05 and 06 moved from KB 14 League to KB 14 Cup, which is Group &
// Knockout. Shots 01-04 stay on KB 14 League. KB 14 Cup is also 14.1's and
// 14.8's fixture, so this spec restores its Group A before it finishes - the
// same contract it already had with KB 14 League.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures14, headerIdentity, centre, onScreen, freezeClock,
  scheduleReady, scheduleCard, scheduleCardHeader, fixtureCard, openBulkDialog,
  untickSameStartTime, pickDate, pickTime, asUser, restoreGroupSchedule,
  LEAGUE_SCHEDULE, CUP_GROUP_A_SCHEDULE,
} from '../../lib/kb';

test.describe('14.5 Rescheduling fixtures', () => {
  test('a single card, a selection of matches, and the roll onto the next day', async ({ page }) => {
    const fx = await fixtures14();
    const detail = await fx.detail(fx.league);
    const groupId = detail.groups[0].id;

    await signInAs(page, fx.email, `/tournaments/${fx.league}/schedule`);
    await quiet(page);
    await freezeClock(page);
    await scheduleReady(page);

    // The four editable cells. Outlined as one row rather than one each: the
    // step is "everything on this strip can be changed here", and the style
    // guide allows one annotation per screenshot.
    const card = await fixtureCard(page, 'KB 14 Kestrels');
    const cells = onScreen(card.getByRole('button', { name: 'Sat, Sep 26 2026', exact: true })).first()
      .locator('xpath=ancestor::div[contains(@class,"grid-cols-2")][1]');
    await centre(card);
    await shot(page, '14.5', '01-fixture-card-fields', {
      clip: card,
      annotate: cells,
      annotatePad: -2,
    });

    // Changing one fixture: its own time opens the same picker the bulk dialog
    // uses. Captured as a viewport shot because the picker is portalled to the
    // end of the document and falls outside a clip of the card.
    const time = onScreen(card.getByRole('button', { name: '10:00', exact: true })).first();
    await centre(time);
    await time.click();
    const picker = onScreen(page.locator('[data-radix-popper-content-wrapper]')).first();
    await expect(picker.getByText('AM', { exact: true })).toBeVisible();
    await shot(page, '14.5', '02-time-picker-open', { mask: [headerIdentity(page)] });
    // Closed without choosing. Nothing is written by this shot.
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-radix-popper-content-wrapper]').locator('visible=true')).toHaveCount(0);

    // The pitch cell turns into a text input in place. It only responds to a
    // dispatched click - a real mouse sequence opens and closes it. Two other
    // controls in this product behave the same way (the venue add button in
    // 12.3, the padel player count in 12.11), so it is a house pattern rather
    // than a one-off.
    const pitch = onScreen(card.getByRole('button', { name: '-', exact: true })).first();
    await pitch.evaluate((el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    const pitchInput = card.locator('input[name="pitchNumber"]');
    await expect(pitchInput).toBeVisible();
    await centre(card);
    await shot(page, '14.5', '03-pitch-number-input', {
      clip: card,
      annotate: pitchInput,
      annotatePad: -2,
    });
    await page.keyboard.press('Escape');

    // Selection mode. The button counts what is ticked, and the dialog it opens
    // is the same Bulk Match Updates - addressed to those matches instead of the
    // whole group.
    const header = await scheduleCardHeader(page, 'Group A');
    await header.getByRole('button', { name: 'Select Match To Update', exact: true }).click();
    await page.getByRole('checkbox', { name: 'Select Match 1' }).click();
    await page.getByRole('checkbox', { name: 'Select Match 2' }).click();
    const updateSelected = header.getByRole('button', { name: 'Update Selected Matches (2)', exact: true });
    await expect(updateSelected).toBeVisible();
    const selecting = await scheduleCard(page, 'Group A');
    await centre(selecting);
    await shot(page, '14.5', '04-select-matches', {
      clip: selecting,
      annotate: updateSelected,
    });
    await header.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(header.getByRole('button', { name: 'Bulk Match Update', exact: true })).toBeVisible();

    // Round Robin has NO cutoff field. Asserted here, on this article's first
    // fixture, because the article now says so in as many words. If the field
    // ever comes back, this fails and the article needs its scope note removed.
    const leagueDialog = await openBulkDialog(page, await scheduleCard(page, 'Group A'));
    await expect(leagueDialog.getByText('End time', { exact: true })).toHaveCount(0);
    await expect(leagueDialog.getByText('Last allowed match start time', { exact: true })).toHaveCount(0);
    await leagueDialog.getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);

    const restoredLeague = await restoreGroupSchedule(asUser, fx.token, groupId, LEAGUE_SCHEDULE);
    expect(restoredLeague.ok, 'restoring KB 14 League failed').toBeTruthy();
  });

  // The roll, on KB 14 Cup - Group & Knockout, the only football format that
  // still has a cutoff.
  //
  // Six fixtures in Group A, 15 minutes each with 20 between them, first at
  // 10:00 and an End time of 11:00. The rule is finish-inclusive: a fixture
  // rolls when it would FINISH past the End time, not when it would start past
  // it.
  test('rolling a group onto the next day, on a Group and Knockout tournament', async ({ page }) => {
    const fx = await fixtures14();
    const detail = await fx.detail(fx.cup);
    const groupA = detail.groups.find((g: any) => g.name === 'Group A') ?? detail.groups[0];

    await signInAs(page, fx.email, `/tournaments/${fx.cup}/schedule`);
    await quiet(page);
    await freezeClock(page);
    await scheduleReady(page);

    const card = await scheduleCard(page, 'Group A');
    const dialog = await openBulkDialog(page, card);
    // One month forward: freezeClock pins the app to 28 Aug 2026, so the date
    // picker opens on August and KB 14 Cup's own date is 19 September.
    await pickDate(page, dialog.getByRole('button', { name: 'Select date' }), 1, '19');
    await pickTime(page, dialog.getByRole('button', { name: 'Select time' }).first(), '10', '00', 'AM');
    await pickTime(page, dialog.getByRole('button', { name: 'Select time' }).first(), '11', '00', 'AM');
    await untickSameStartTime(dialog);
    await dialog.locator('input[name="duration"]').fill('15');
    await dialog.locator('input[name="timeBetweenMatches"]').fill('20');

    const endTime = dialog.getByText('End time', { exact: true });
    await expect(endTime).toBeVisible();
    // The help text IS the rule, and the article quotes it. Assert it rather
    // than trusting the label: the label changed name, but what changed meaning
    // is the arithmetic underneath it.
    await expect(dialog.getByText('If the next match would finish past this time, scheduling moves to the next day.'))
      .toBeVisible();
    await shot(page, '14.5', '05-end-time', {
      clip: dialog,
      annotate: endTime.locator('xpath=..'),
    });

    try {
      await dialog.getByRole('button', { name: 'Update Matches' }).click();
      await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);

      // Wait for the THIRD day to appear before capturing. Not decoration: the
      // dialog closes before the refetch lands, and a capture taken on the
      // `[role="dialog"]` count alone photographs the schedule as it was. That
      // is exactly what the first run of this rewrite produced - six fixtures
      // still ten minutes apart on one day. This assertion is the proof the
      // update applied, so do not remove it in favour of a bare wait.
      const rolled = await scheduleCard(page, 'Group A');
      await expect(onScreen(rolled.getByRole('button', { name: 'Mon, Sep 21 2026', exact: true })).first())
        .toBeVisible({ timeout: 30_000 });
      await scheduleReady(page);
      await centre(rolled);
      await shot(page, '14.5', '06-rolled-across-days', { clip: rolled });
    } finally {
      // KB 14 Cup is 14.1's and 14.8's fixture. Restore it whatever happened
      // above, or their captures change on the next run.
      const restored = await restoreGroupSchedule(asUser, fx.token, groupA.id, CUP_GROUP_A_SCHEDULE);
      expect(restored.ok, 'restoring KB 14 Cup Group A failed').toBeTruthy();
    }
  });
});
