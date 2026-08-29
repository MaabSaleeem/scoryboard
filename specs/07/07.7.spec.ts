// 07.7 - Team roles: Owner, Administrator and Player.
//
// RETITLED from the map's "Owner, Administrator, Player and Fan". The Fan role
// exists in the API - POST /team-players takes role: "Fan" and
// GET /teams/:id/players hides those rows unless ?includeFans=true - but the web
// app's TeamRole enum has no Fan, nothing in the UI can create one, and a Fan
// row renders with no role badge at all. No fixture here holds one. See
// briefs/07.md and config/api.md.
//
// Flagged free_pro, and the two halves are two OWNERS rather than one account
// flipped: the persona owns every other fixture in this collection, and flipping
// him to Free would change what ten other articles photograph.
//
// The Pro half does not submit - changing a real member's role would alter what
// 07.4 and 07.5 show. The Free half DOES submit, because it is refused: the API
// answers 400 TEAM_ADMIN_LIMIT_EXCEEDED and nothing is written.

import { test, expect } from '@playwright/test';
import {
  shot, quiet07, signInAs, unstickHeader, onScreen, openDialog, centre,
  fixtures07, teamCard, memberRow, memberRowMenu, openSelect,
  sidebarIdentity, notificationBadge,
  KB07, KB07_PROFILES, KB07_TEAMS,
} from '../../lib/kb';

const MO = `${KB07_PROFILES.pro.name} ${KB07_PROFILES.pro.lastName}`;
const FRED = `${KB07_PROFILES.free.name} ${KB07_PROFILES.free.lastName}`;

test.describe('07.7 Team roles - Owner, Administrator and Player', () => {
  test('the badges, and the two roles you can set (Pro)', async ({ page }) => {
    const fx = await fixtures07();

    await signInAs(page, KB07.pro, `/teams/${fx.teams.united}/settings`);
    await quiet07(page);
    await expect(page.getByText(`Edit Team - ${KB07_TEAMS.united}`)).toBeVisible();
    await unstickHeader(page);
    const masks = [sidebarIdentity(page, MO), notificationBadge(page)];

    // 01 - all three badges in one frame. Note the badge says "Admin" while
    // every dropdown in the app says "Administrator"; the article uses the
    // dropdown's word and points out the badge.
    const players = await teamCard(page, 'TEAM PLAYERS');
    await expect(players.getByText('Owner', { exact: true }).first()).toBeVisible();
    await expect(players.getByText('Admin', { exact: true }).first()).toBeVisible();
    await expect(players.getByText('Player', { exact: true }).first()).toBeVisible();
    await centre(players);
    await shot(page, '07.7', '01-role-badges', { clip: players });

    // 02 - a member's Edit dialog. Reached from their own row's menu.
    await memberRowMenu(page, KB07.player).click();
    const edit = page.getByRole('menuitem', { name: 'Edit', exact: true });
    await expect(edit).toBeVisible();
    await edit.click();
    const dialog = openDialog(page);
    await expect(dialog.getByText('Edit Player', { exact: true })).toBeVisible();
    // The address cannot be changed on an existing member, which the field says.
    await expect(dialog.getByText('Player email (cannot be changed)')).toBeVisible();
    await shot(page, '07.7', '02-edit-player-dialog', { clip: dialog });

    // 03 - the Role list. TWO options. There is no Owner in it, which is the
    // evidence behind 07.9's claim that ownership cannot be handed on.
    const role = dialog.locator('[role="combobox"]').nth(1);
    const list = await openSelect(page, role);
    await expect(list.locator('[role="option"]')).toHaveCount(2);
    await shot(page, '07.7', '03-role-list-pro', { mask: masks });

    // Abandoned. Nobody's role is changed.
  });

  // Fred is Free and owns his own team. Signing in as a second account needs a
  // second test: a spec cannot switch accounts inside one.
  test('what happens on Free', async ({ page }) => {
    const fx = await fixtures07();

    await signInAs(page, KB07.free, `/teams/${fx.teams.casuals}/settings`);
    await quiet07(page);
    await expect(page.getByText(`Edit Team - ${KB07_TEAMS.casuals}`)).toBeVisible();
    await unstickHeader(page);
    const masks = [sidebarIdentity(page, FRED), notificationBadge(page)];

    const players = await teamCard(page, 'TEAM PLAYERS');
    await players.getByRole('button', { name: 'Add New Player', exact: true }).click();
    const dialog = openDialog(page);
    await dialog.getByPlaceholder('Enter name').fill('Tara KB');

    // Free offers Administrator exactly as Pro does. The refusal only arrives on
    // submit, which is why this half has to be submitted to be photographed.
    const role = dialog.locator('[role="combobox"]').nth(1);
    const list = await openSelect(page, role);
    await list.getByText('Administrator', { exact: true }).first().click();
    await expect(role).toContainText('Administrator');

    await dialog.getByRole('button', { name: 'Add Player', exact: true }).click();

    // 04 - the gate. A real dialog, not a toast, so quiet07() does not hide it.
    const gate = onScreen(page.getByText('Team Limit Reached')).first();
    await expect(gate).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Free plan users can ?not add team admins/)).toBeVisible();
    await shot(page, '07.7', '04-team-limit-free', { mask: masks });

    // 05 - and the way out of it, which costs nothing during the beta.
    const modal = gate.locator('xpath=ancestor::div[contains(@class,"rounded")][1]');
    const upgrade = modal.getByRole('button', { name: /FREE Upgrade/ });
    await expect(upgrade).toBeVisible();
    await shot(page, '07.7', '05-free-upgrade-pro', { clip: modal, annotate: upgrade });

    // Nothing was added: the API refused it. Prove that rather than assume it.
    const still = (await page.locator('text=Team Members').first().innerText());
    expect(still).toContain('(3)');
  });
});
