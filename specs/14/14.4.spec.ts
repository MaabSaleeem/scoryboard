// 14.4 - Bulk-scheduling padel rounds, courts and the gap between rounds.
//
// Fixture: KB 14 Padel Open, the mutable padel tournament. This spec re-times its
// group and REGENERATES it at the end, because 14.2 and 14.7 photograph the same
// round-and-court shape on the other padel fixtures and a court number cannot be
// put back any other way - a bulk update writes one court across every match it
// touches. See lib/fixtures-14.mjs.
//
// The article's three subjects, and where each one actually lives:
//
//   rounds  - the "Same start time per round" box in Bulk Match Updates. Leave it
//             ticked and the matches of a round share a kick-off.
//   courts  - "Court number" in the same dialog, which is the only field that
//             differs from football's ("Pitch number").
//   the gap - NOT in this dialog. "Gap between rounds (minutes)" is in Padel
//             Configuration on the Format tab, and the dialog disables its own
//             Time between matches field whenever the round box is ticked.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures14, headerIdentity, centre, onScreen, freezeClock,
  scheduleReady, scheduleCard, openBulkDialog, openDialog, cancelDialog,
  pickDate, pickTime, asUser, regeneratePadelSchedule,
} from '../../lib/kb';

test.describe('14.4 Bulk-scheduling padel rounds and courts', () => {
  test('the round box, the court field, and where the round gap really is', async ({ page }) => {
    const fx = await fixtures14();

    await signInAs(page, fx.email, `/tournaments/${fx.padelOpen}/schedule`);
    await quiet(page);
    await freezeClock(page);
    await scheduleReady(page);

    const card = await scheduleCard(page, 'Group A');
    const dialog = await openBulkDialog(page, card);

    // Court number, not Pitch number. Same dialog, same position, one word
    // different - and it is the only thing on this screen that knows the
    // tournament is padel.
    const courtLabel = dialog.getByText('Court number', { exact: true });
    await expect(courtLabel).toBeVisible();
    await shot(page, '14.4', '01-court-number-field', {
      clip: dialog,
      annotate: dialog.locator('input[name="pitchNumber"]'),
    });

    // The round box, ticked as it opens, with Time between matches greyed out
    // above it. On padel that default is the right one: it is what keeps the two
    // matches of a round starting together.
    const sameStart = dialog.locator('[role="checkbox"]').first();
    await expect(sameStart).toHaveAttribute('data-state', 'checked');
    await expect(dialog.locator('input[name="timeBetweenMatches"]')).toBeDisabled();
    await centre(sameStart);
    await shot(page, '14.4', '02-same-start-time-per-round', {
      clip: dialog,
      annotate: sameStart.locator('xpath=..'),
    });

    // 17 October 2026, first round at 09:00. The clock is frozen to 28 August
    // 2026, so October is two months forward from the month the calendar opens
    // on. Court is left alone: writing one court number across every match is
    // what 14.7 documents as a clash, not something to teach here.
    await pickDate(page, dialog.getByRole('button', { name: 'Select date' }), 2, '17');
    await pickTime(page, dialog.getByRole('button', { name: 'Select time' }).first(), '09', '00', 'AM');
    await expect(dialog.getByText('17-10-2026', { exact: true })).toBeVisible();
    await shot(page, '14.4', '03-dialog-filled', { clip: dialog });

    await dialog.getByRole('button', { name: 'Update Matches' }).click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);

    const updated = await scheduleCard(page, 'Group A');
    await expect(onScreen(updated.getByRole('button', { name: '9:00', exact: true })).first()).toBeVisible();
    await scheduleReady(page);
    await centre(updated);
    await shot(page, '14.4', '04-rounds-after-update', { clip: updated });

    // The gap between rounds is not in that dialog at all. It is a field in Padel
    // Configuration, on the Format tab, and it is what puts twenty minutes
    // between one round and the next: the match duration plus this number.
    await page.goto(`/tournaments/${fx.padelOpen}/format`);
    await quiet(page);
    await expect(page.getByText('Player 1 & Player 2', { exact: true }).first()).toBeVisible();
    await onScreen(page.getByRole('button', { name: 'Configuration', exact: true })).first().click();
    const config = openDialog(page);
    await expect(config.getByText('Padel Configuration', { exact: true })).toBeVisible();
    await shot(page, '14.4', '05-gap-between-rounds', {
      clip: config,
      annotate: config.locator('input[name="padelRoundGapMinutes"]'),
    });
    // Cancelled, not saved. Saving would rebuild the fixtures, and this article
    // does not change the gap - it says where it is.
    await cancelDialog(page);

    // Regenerate KB 14 Padel Open from its format, which is the only thing that
    // restores the per-match court numbers.
    const restored = await regeneratePadelSchedule(asUser, fx.token, fx.padelOpen);
    expect(restored.ok, 'regenerating KB 14 Padel Open failed').toBeTruthy();
  });
});
