// 08.2 - Your leaderboard settings screen.
//
// A tour of /leaderboards/:id/settings. Four sections are this article's: Profile
// Appearance, Basic Information, Roles, and the Add Admin window that Roles
// opens. Teams belongs to 08.3 and Delete Leaderboard to 08.5.
//
// Six shots, not the five the map estimated. The sixth is the screen a reader
// without the role gets, which docs/style-guide.md requires an article flagged
// `role` to show - and it is not an Access denied page, it is the app's error
// boundary. See briefs/08.md.
//
// Two things the reader will look for and not find:
//
//   * Leaderboard style is `disabled` and reads "Football leaderboard". There is
//     no second option and no way to change it.
//   * Discard and Save Changes are disabled until something is edited.
//
// Reads only. Nothing here saves, adds an admin, or removes one: the Add Admin
// window is photographed, not submitted.

import { test, expect } from '@playwright/test';
import {
  shot, quiet08, signInAs, onScreen, unstickHeader,
  sidebarIdentity, moving08,
  fixtures08, KB08, KB08_LEAGUE, KB08_TEAMS,
  leaderboardListReady, loadOwnTeams08, settings08Ready, board08Section, dialog08, close08Dialog,
} from '../../lib/kb';

test.describe('08.2 Your leaderboard settings screen', () => {
  test('the four sections the owner edits, and what a visitor gets instead', async ({ page }) => {
    const fx = await fixtures08();

    await signInAs(page, KB08.pro, '/leaderboards');
    await leaderboardListReady(page, 1, [KB08_LEAGUE]);
    // Manage Teams first, and not for tidiness: only /teams fills the store
    // slice the app checks a team's ownership against, and without it every team
    // the reader owns is badged External on the screens below. See
    // loadOwnTeams08().
    await loadOwnTeams08(page, KB08_TEAMS.united);
    await page.goto(`/leaderboards/${fx.leaderboard.id}/settings`);
    await quiet08(page);
    await settings08Ready(page, KB08_LEAGUE);

    const mask = [sidebarIdentity(page, 'Mo KB'), ...moving08(page)];

    // 01 - the whole screen, so the reader can see the five sections in order
    // before any of them is explained. unstickHeader() first: the app's header
    // is position: sticky, and without it Playwright stitches a second copy of
    // it into the middle of a full-page capture.
    await unstickHeader(page);
    await shot(page, '08.2', '01-settings-full', { fullPage: true, mask });

    // 02 - Profile Appearance. Two images, not one: a banner across the top and
    // a round logo on it, each with its own pencil and bin. The logo is initials
    // until one is uploaded, and the banner is one of six stock images.
    const appearance = await board08Section(page, 'Profile Appearance');
    await expect(appearance.getByText('JPG, GIF or PNG. 3MB max.')).toBeVisible();
    await expect(appearance.locator('input[aria-label="Upload banner image"]')).toHaveCount(1);
    await expect(appearance.locator('input[aria-label="Upload avatar image"]')).toHaveCount(1);
    await shot(page, '08.2', '02-appearance', { clip: appearance });

    // 03 - Basic Information. The subject is the style field being read-only:
    // asserted, because the whole paragraph about it in the article depends on
    // it, and a future release could make it editable.
    const basic = await board08Section(page, 'BASIC INFORMATION');
    const style = onScreen(basic.locator('input[name="leaderboardStyle"]')).first();
    await expect(style).toBeDisabled();
    await expect(style).toHaveValue('Football leaderboard');
    await expect(onScreen(basic.locator('input[name="leaderboardName"]')).first())
      .toHaveValue(KB08_LEAGUE);
    await expect(onScreen(basic.getByRole('button', { name: 'Save Changes' })).first()).toBeDisabled();
    await expect(onScreen(basic.getByRole('button', { name: 'Discard' })).first()).toBeDisabled();
    await shot(page, '08.2', '03-basic-information', { clip: basic, annotate: style });

    // 04 - Roles. The Owner is a disabled field carrying an address, and the
    // Admins list below it is the only part of this screen a Free account cannot
    // use: POST /leaderboards/:id/admin answers LEADERBOARD_ADMIN_LIMIT_EXCEEDED
    // on Free. The addresses on screen are this collection's own fixtures.
    const roles = await board08Section(page, 'ROLES');
    await expect(roles.getByText('Owner and admins of this leaderboard.')).toBeVisible();
    await expect(onScreen(roles.locator('input[name="owner"]')).first()).toBeDisabled();
    await expect(onScreen(roles.locator('input[name="owner"]')).first()).toHaveValue(KB08.pro);
    await expect(roles.getByText('Ada KB', { exact: true })).toBeVisible();
    await expect(roles.getByText(KB08.admin, { exact: true })).toBeVisible();
    const addAdmin = onScreen(roles.getByRole('button', { name: 'Add Admin' })).first();
    await shot(page, '08.2', '04-roles', { clip: roles, annotate: addAdmin });

    // 05 - the Add Admin window. Two ways in - pick a player, or type an address
    // - and Continue is disabled until one of them is filled. Photographed, not
    // submitted: Ada is already the administrator this fixture needs, and adding
    // a second one would change what shot 04 shows on the next run.
    await addAdmin.click();
    const dlg = await dialog08(page, 'Add Admin');
    await expect(dlg.getByText('Select player', { exact: true })).toBeVisible();
    await expect(dlg.getByText('OR', { exact: true })).toBeVisible();
    await expect(onScreen(dlg.locator('input[name="email"]')).first()).toBeVisible();
    await expect(onScreen(dlg.getByRole('button', { name: 'Continue' })).first()).toBeDisabled();
    await shot(page, '08.2', '05-add-admin-window', { clip: dlg, clipPad: 24 });
    await close08Dialog(page);
  });

  test('a visitor who is neither Owner nor Administrator cannot open it', async ({ page }) => {
    const fx = await fixtures08();

    await signInAs(page, KB08.outsider, '/leaderboards');
    await quiet08(page);

    // 06 - not an Access denied screen. The settings page fails to the app's own
    // error boundary, with no API call behind it and no explanation of why. The
    // article says what it means, because the screen does not.
    await page.goto(`/leaderboards/${fx.leaderboard.id}/settings`);
    await expect(onScreen(page.getByText('This page couldn’t load')).first()).toBeVisible();
    await expect(onScreen(page.getByText('Reload to try again, or go back.')).first()).toBeVisible();
    await expect(onScreen(page.getByRole('button', { name: 'Reload' }))).toHaveCount(1);
    await shot(page, '08.2', '06-settings-blocked', {
      mask: [sidebarIdentity(page, 'Ola KB'), ...moving08(page)],
    });
  });
});
