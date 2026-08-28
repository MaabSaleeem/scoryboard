// 12.8 - Tournament settings, admins, and what a non-admin gets.
//
// Two personas. The organiser owns KB Cup; kb-12-outsider@yopmail.com has no
// relationship to it at all.
//
// The settings page has no tab on the board. It is reached from the tournament
// card's menu on the tournament list - the three dots, then Edit - or directly at
// /tournaments/<id>/settings. The article shows the menu, because a reader will
// look for a tab on the board and not find one.
//
// The app does not render an "Access Denied" screen for a non-admin: it
// redirects to the public page at /tournament/<id>/info. The i18n bundle carries
// Access Denied copy, but no state reached it. See briefs/12.md, open question 5.
//
// The Add Admin dialog is filled but not submitted - the seed already put
// kb-12-admin@yopmail.com on the tournament, and submitting again would add a
// second admin the next run would have to clean up.

import { test, expect } from '@playwright/test';
import { signIn, quiet, shot, fixtures, headerIdentity } from '../../lib/kb';

test.describe('12.8 Settings and admins', () => {
  test('what the owner can change', async ({ page }) => {
    const fx = await fixtures('organiser');

    // Reach settings the way a reader does: the card menu on the tournament list.
    await signIn(page, 'organiser', '/tournaments');
    await quiet(page);
    await page.getByText('Your Tournaments (2)', { exact: true }).waitFor();
    // Both cards, not just the count: the heading updates before the cards do.
    await expect(page.getByText('KB Cup', { exact: true })).toBeVisible();
    await expect(page.getByText('KB New Cup', { exact: true })).toBeVisible();

    const cardMenu = page.getByRole('button').filter({ has: page.locator('svg.lucide-ellipsis-vertical') }).last();
    await cardMenu.click();
    const menu = page.getByRole('menu');
    await expect(menu.getByText('Edit')).toBeVisible();
    // Header name only, to match the other tournament-list captures. The
    // creation date is the tournament's own, not today's, so it does not drift.
    await shot(page, '12.8', '01-settings-from-the-card-menu', {
      mask: [headerIdentity(page)],
    });

    await menu.getByText('Edit').click();
    // Wait for the heading, never for the URL: the page redirects anyone without
    // a role away, and the guard runs before the tournament has loaded.
    await page.getByText('Edit Tournament - KB Cup').waitFor();
    await shot(page, '12.8', '02-edit-tournament-page', { mask: [headerIdentity(page)] });

    const roles = page.getByText(/owner and admins of this tournament/i);
    await roles.scrollIntoViewIfNeeded();
    await shot(page, '12.8', '03-roles-and-administration', {
      mask: [headerIdentity(page)],
    });

    await page.getByRole('button', { name: 'Add Admin' }).click();
    const dialog = page.getByRole('dialog').filter({ hasText: 'Add Admin' });
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder('Enter email address').fill('coach@example.com');
    await shot(page, '12.8', '04-add-admin-dialog', {
      clip: dialog,
      annotate: dialog.getByRole('button', { name: 'Continue' }),
    });
    await dialog.getByRole('button', { name: 'Close' }).click();

    const adminRow = page.getByText('kb-12-admin@yopmail.com');
    await adminRow.scrollIntoViewIfNeeded();
    await shot(page, '12.8', '05-an-admin-on-the-tournament', {
      mask: [headerIdentity(page)],
      annotate: adminRow,
    });
  });

  test('what someone with no role gets', async ({ page }) => {
    const fx = await fixtures('organiser');

    await signIn(page, 'outsider', `/tournaments/${fx.cup}/settings`);
    await quiet(page);
    // The redirect lands on the public page. Assert on its content, not the URL.
    await page.getByText(/tournament format/i).first().waitFor();
    // The Info tab loads its summary first and its fixture list after. Wait for
    // the fixtures, or two runs capture different amounts of the page.
    await expect(page.getByText(/^fixtures$/i).first()).toBeVisible();
    // The redirect lands on the read-only Info view. Both /tournament/<id>/info
    // and /tournaments/<id>/info have been seen serving it, so assert only the
    // tab, not the whole path.
    expect(page.url()).toContain('/info');
    await shot(page, '12.8', '06-no-role-goes-to-the-public-page', {
      mask: [page.getByText('Otto KB', { exact: true })],
    });
  });
});
