// 12.10 - Editing after setup, and deleting.
//
// The map titles this "What locks when you go live, editing after setup,
// deleting". The live lock could not be produced. A tournament only becomes Live
// when a match starts, which is collection 15; PUT /tournaments/:id
// {"status":"Live"} answers 200 and changes nothing. The lock message exists in
// the app bundle - "This tournament is already live, so the name and dates are
// locked" - but no state this session could reach rendered it. See briefs/12.md,
// open question 6, and the Unreachable section.
//
// The delete dialog is opened and its confirmation typed. It is NEVER confirmed.
// Deleting the fixture would burn a Tournament Pro slot that cannot be restored.

import { test, expect } from '@playwright/test';
import { signIn, quiet, shot, fixtures, headerIdentity } from '../../lib/kb';

test.describe('12.10 Editing after setup and deleting', () => {
  test('what stays editable, and how deletion is confirmed', async ({ page }) => {
    const fx = await fixtures('organiser');

    await signIn(page, 'organiser', `/tournaments/${fx.cup}/settings`);
    await quiet(page);
    await page.getByText('Edit Tournament - KB Cup').waitFor();

    const details = page.getByText('Tournament Details', { exact: true });
    await details.scrollIntoViewIfNeeded();
    await shot(page, '12.10', '01-what-you-can-still-change', {
      mask: [headerIdentity(page)],
    });

    // The format is not on this page. It is changed back on the Format tab, and
    // the tab says so itself.
    await page.goto(`/tournaments/${fx.cup}/format`);
    await quiet(page);
    // Both groups, not just the phase heading: the panel fills in group by group.
    await expect(page.getByText(/^group a$/i).first()).toBeVisible();
    await expect(page.getByText(/^group b$/i).first()).toBeVisible();
    await shot(page, '12.10', '02-the-format-is-changed-on-its-own-tab', {
      mask: [headerIdentity(page)],
    });

    await page.goto(`/tournaments/${fx.cup}/settings`);
    await quiet(page);
    await page.getByText('Edit Tournament - KB Cup').waitFor();
    const save = page.getByRole('button', { name: 'Save Changes' }).first();
    await save.scrollIntoViewIfNeeded();
    await shot(page, '12.10', '03-each-section-saves-on-its-own', {
      mask: [headerIdentity(page)],
      annotate: save,
    });

    const danger = page.getByText(/danger zone/i).first();
    await danger.scrollIntoViewIfNeeded();
    await shot(page, '12.10', '04-danger-zone', { mask: [headerIdentity(page)] });

    await page.getByRole('button', { name: 'Delete Tournament' }).first().click();
    const dialog = page.getByRole('dialog').filter({ hasText: 'Delete Tournament' });
    await expect(dialog).toBeVisible();
    await shot(page, '12.10', '05-delete-confirmation', { clip: dialog });

    await dialog.getByRole('textbox').fill('DELETE');
    await shot(page, '12.10', '06-type-delete-to-confirm', {
      clip: dialog,
      annotate: dialog.getByRole('button', { name: 'Delete Tournament' }),
    });

    // Never confirmed.
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Edit Tournament - KB Cup')).toBeVisible();
  });
});
