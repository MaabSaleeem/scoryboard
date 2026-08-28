// 14.3 - Bulk-scheduling a football group, and the gap between matches.
//
// Fixture: KB 14 League, the mutable football tournament. This spec RE-TIMES its
// group and puts it back at the end, because 14.5 photographs the same group.
// Collection 13's rule: a spec that mutates its fixture must restore it itself.
//
// The subject of the article is the one control that is not obvious: "Same start
// time per round" is TICKED by default, and while it is ticked both Duration and
// Time between matches are disabled. A reader who does not untick it cannot set
// a gap at all - and gets every fixture in the group on one kick-off time, which
// is what 14.6 explains.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures14, headerIdentity, centre, onScreen, freezeClock,
  scheduleReady, scheduleCard, scheduleCardHeader, openBulkDialog, untickSameStartTime,
  pickDate, pickTime, asUser, restoreGroupSchedule, LEAGUE_SCHEDULE,
} from '../../lib/kb';

test.describe('14.3 Bulk-scheduling a football group', () => {
  test('the dialog, the gap it hides, and the times it writes', async ({ page }) => {
    const fx = await fixtures14();
    const detail = await fx.detail(fx.league);
    const groupId = detail.groups[0].id;

    await signInAs(page, fx.email, `/tournaments/${fx.league}/schedule`);
    await quiet(page);
    // The date picker opens on the current month, so the month it opens on has
    // to be pinned before anything counts months forward from it.
    await freezeClock(page);
    await scheduleReady(page);

    const header = await scheduleCardHeader(page, 'Group A');
    await centre(header);
    await shot(page, '14.3', '01-bulk-match-update-button', {
      clip: header,
      annotate: header.getByRole('button', { name: 'Bulk Match Update', exact: true }),
      annotatePad: -2,
    });

    const card = await scheduleCard(page, 'Group A');
    const dialog = await openBulkDialog(page, card);
    // As it opens: the box ticked, and the two fields under it greyed out.
    // Clipped to the dialog, which is taller than the viewport.
    await shot(page, '14.3', '02-dialog-as-it-opens', { clip: dialog });

    const sameStart = await untickSameStartTime(dialog);
    await shot(page, '14.3', '03-gap-fields-enabled', {
      clip: dialog,
      // The gap is the article's subject; Duration is enabled by the same click
      // and the prose says so. One outline, per docs/style-guide.md.
      annotate: dialog.locator('input[name="timeBetweenMatches"]'),
    });
    await expect(sameStart).toHaveAttribute('data-state', 'unchecked');

    // 26 September 2026, kick off at 10:00, 15-minute matches, 20 minutes
    // between them. The clock is frozen to 28 August 2026, so September is one
    // month forward from the month the calendar opens on.
    await pickDate(page, dialog.getByRole('button', { name: 'Select date' }), 1, '26');
    await pickTime(page, dialog.getByRole('button', { name: 'Select time' }).first(), '10', '00', 'AM');
    await dialog.locator('input[name="duration"]').fill('15');
    await dialog.locator('input[name="timeBetweenMatches"]').fill('20');
    await expect(dialog.getByText('26-09-2026', { exact: true })).toBeVisible();
    await shot(page, '14.3', '04-dialog-filled', { clip: dialog });

    await dialog.getByRole('button', { name: 'Update Matches' }).click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);

    // 10:00, then every 35 minutes: the match duration plus the gap. Waiting for
    // the second kick-off proves the list has re-rendered, not just that the
    // dialog closed.
    const updated = await scheduleCard(page, 'Group A');
    await expect(onScreen(updated.getByRole('button', { name: '10:35', exact: true })).first()).toBeVisible();
    await scheduleReady(page);
    await centre(updated);
    await shot(page, '14.3', '05-new-kick-off-times', { clip: updated });

    // Put KB 14 League back. 14.5 photographs this same group.
    const restored = await restoreGroupSchedule(asUser, fx.token, groupId, LEAGUE_SCHEDULE);
    expect(restored.ok, 'restoring KB 14 League failed').toBeTruthy();
  });
});
