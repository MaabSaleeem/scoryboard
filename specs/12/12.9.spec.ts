// 12.9 - Referees on a tournament.
//
// A tournament referee is created by name on the tournament. It is not the same
// thing as the referee profile in collection 21: no account, no invitation, no
// email field. The Saved referees tab reuses ones you ticked "Save for future
// tournaments" on.
//
// The empty state comes from "KB New Cup", the populated one from "KB Cup",
// which the seed gives two referees - Rae Whistle with permission to start and
// end matches, Sam Flag without. The dialog is opened and filled but never
// submitted, so neither fixture changes.

import { test, expect } from '@playwright/test';
import { signIn, quiet, shot, fixtures, headerIdentity } from '../../lib/kb';

test.describe('12.9 Referees on a tournament', () => {
  test('adding referees and what they are allowed to do', async ({ page }) => {
    const fx = await fixtures('organiser');

    await signIn(page, 'organiser', `/tournaments/${fx.newCup}/participants`);
    await quiet(page);
    await page.getByRole('button', { name: 'Referees' }).click();
    await page.getByText('No referees added yet', { exact: true }).waitFor();
    await shot(page, '12.9', '01-no-referees-added-yet', {
      mask: [headerIdentity(page)],
      annotate: page.getByRole('button', { name: 'Add Referee' }),
    });

    await page.getByRole('button', { name: 'Add Referee' }).click();
    const dialog = page.getByRole('dialog').filter({ hasText: 'Add referee' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('No saved referees yet.')).toBeVisible();
    await shot(page, '12.9', '02-saved-referees-tab', { clip: dialog });

    await dialog.getByRole('button', { name: 'Single referee' }).click();
    await expect(dialog.getByText('Save for future tournaments')).toBeVisible();
    await shot(page, '12.9', '03-add-a-single-referee', { clip: dialog });

    await dialog.getByRole('button', { name: 'Multiple referees' }).click();
    const list = dialog.locator('textarea[name="refereeList"]');
    await list.fill('Rae Whistle\nSam Flag');
    await expect(dialog.getByText('2 referees ready to add')).toBeVisible();
    await shot(page, '12.9', '04-add-many-referees', { clip: dialog });

    const permission = dialog.getByText('Allow referee to start and end matches');
    await shot(page, '12.9', '05-start-and-end-matches-permission', {
      clip: dialog,
      annotate: permission,
    });

    // Not submitted. The populated list comes from the configured fixture.
    await dialog.getByRole('button', { name: 'Close' }).click();

    await page.goto(`/tournaments/${fx.cup}/participants`);
    await quiet(page);
    await page.getByRole('button', { name: 'Referees' }).click();
    await page.getByText('List of all Referees (2)').waitFor();
    await shot(page, '12.9', '06-referees-on-the-tournament', {
      mask: [headerIdentity(page)],
    });
  });
});
