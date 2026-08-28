// 13.4 - Editing a group in a padel tournament.
//
// Fixture: KB 13 Padel Cup. A padel group has Edit and no Delete, and its Edit
// dialog carries a Name and nothing else - the team count and the encounters
// come from the padel configuration instead (13.10).
//
// The only way to remove the structure is Delete <format> format, which takes
// both phases with it. That dialog is opened and CANCELLED: deleting the format
// cannot be undone and three other articles photograph this fixture.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures13, headerIdentity, centre, onScreen, boardReady,
} from '../../lib/kb';

test.describe('13.4 Editing a padel group', () => {
  test('edit with no delete, and deleting the format instead', async ({ page }) => {
    const fx = await fixtures13();

    await signInAs(page, fx.email, `/tournaments/${fx.padelCup}/format`);
    await quiet(page);
    await boardReady(page, page.getByText('Player 1 & Player 2', { exact: true }));

    const edit = page.locator('[aria-label="Edit Group A"]').locator('visible=true').first();
    await expect(edit).toBeVisible();
    // The absence is the point: a padel group has no Delete control at all.
    await expect(page.locator('[aria-label="Delete Group A"]')).toHaveCount(0);
    await centre(edit);
    await shot(page, '13.4', '01-padel-group-edit-only', {
      mask: [headerIdentity(page)],
      annotate: edit,
    });

    await edit.click();
    const dialog = onScreen(page.locator('[role="dialog"]')).first();
    await expect(dialog.getByText('Edit group', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Name', { exact: true })).toBeVisible();
    // No team count and no encounters, unlike football's dialog.
    await expect(dialog.getByText('Number of teams', { exact: true })).toHaveCount(0);
    await expect(dialog.getByText('Encounters', { exact: true })).toHaveCount(0);
    await shot(page, '13.4', '02-edit-group-name-only', { mask: [headerIdentity(page)] });
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);

    const deleteFormat = page.locator('[aria-label="Delete Swiss format"]').locator('visible=true').first();
    await centre(deleteFormat);
    await shot(page, '13.4', '03-delete-swiss-format-button', {
      mask: [headerIdentity(page)],
      annotate: deleteFormat,
    });

    await deleteFormat.click();
    const confirm = onScreen(page.locator('[role="dialog"]')).first();
    await expect(confirm.getByText('Delete Swiss format', { exact: true })).toBeVisible();
    await expect(
      confirm.getByText('Delete the complete Swiss format, including its group and knockout phases?'),
    ).toBeVisible();
    await shot(page, '13.4', '04-delete-swiss-format-confirm', { mask: [headerIdentity(page)] });

    // Cancel, always. Deleting the format destroys the fixture 13.2, 13.8 and
    // 13.10 photograph, and there is no undo.
    await confirm.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);
    await expect(page.getByText('Player 1 & Player 2', { exact: true })).toBeVisible();
  });
});
