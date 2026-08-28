// 13.3 - Editing and deleting a group in a football tournament.
//
// Fixture: KB 13 Cup. Every dialog is opened and cancelled: nothing is renamed,
// resized or deleted, so the fixture the other football articles photograph is
// untouched.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures13, headerIdentity, centre, onScreen, boardReady,
} from '../../lib/kb';

test.describe('13.3 Editing and deleting a football group', () => {
  test('the edit dialog, the encounters list and the delete confirm', async ({ page }) => {
    const fx = await fixtures13();

    await signInAs(page, fx.email, `/tournaments/${fx.cup}/format`);
    await quiet(page);
    await boardReady(page, page.getByText('KB 13 Reds', { exact: true }));

    const edit = page.locator('[aria-label="Edit Group A"]').locator('visible=true').first();
    const remove = page.locator('[aria-label="Delete Group A"]').locator('visible=true').first();
    // The group's header row, so the annotation covers both controls at once.
    const header = edit.locator('xpath=ancestor::div[1]');
    await centre(header);
    await expect(remove).toBeVisible();
    await shot(page, '13.3', '01-group-edit-and-delete', {
      mask: [headerIdentity(page)],
      annotate: header,
    });

    await edit.click();
    const dialog = onScreen(page.locator('[role="dialog"]')).first();
    await expect(dialog.getByText('Edit group', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Encounters', { exact: true })).toBeVisible();
    await shot(page, '13.3', '02-edit-group-dialog', { mask: [headerIdentity(page)] });

    const encounters = dialog.locator('[role="combobox"]').first();
    await encounters.click();
    const list = onScreen(page.getByRole('listbox')).first();
    await expect(list.getByText('Play all teams in pool once', { exact: true })).toBeVisible();
    await expect(list.getByText('10', { exact: true })).toBeVisible();
    await shot(page, '13.3', '03-encounters-open', { mask: [headerIdentity(page)] });

    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox').locator('visible=true')).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);

    await page.locator('[aria-label="Delete Group A"]').locator('visible=true').first().click();
    const confirm = onScreen(page.locator('[role="dialog"]')).first();
    await expect(confirm.getByText('Delete group', { exact: true })).toBeVisible();
    await expect(
      confirm.getByText('Are you sure you want to delete this group and all its matches?'),
    ).toBeVisible();
    await shot(page, '13.3', '04-delete-group-confirm', { mask: [headerIdentity(page)] });
    await confirm.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);

    // Removing one team is a different action, on the team's own menu. That
    // button carries no accessible name and sits outside the row's own subtree,
    // so it is matched by shape: the only unlabelled popup triggers on the board
    // are the per-team menus, one per team, in board order. The seed pins that
    // order, so nth(0) is always KB 13 Reds.
    const menuButtons = page.locator('main button[data-state="closed"]:not([aria-label])')
      .locator('visible=true');
    await expect(menuButtons).toHaveCount(9);   // eight teams, plus the language picker
    const menuButton = menuButtons.first();
    await centre(menuButton);
    await menuButton.click();
    const menu = onScreen(page.locator('[role="menu"]')).first();
    await expect(menu.getByText('Remove team', { exact: true })).toBeVisible();
    await shot(page, '13.3', '05-team-menu-remove', { mask: [headerIdentity(page)] });
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="menu"]').locator('visible=true')).toHaveCount(0);
  });
});
