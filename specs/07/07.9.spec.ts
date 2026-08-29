// 07.9 - Claiming a team.
//
// RETITLED from the map's "Claiming a team and transferring ownership". There is
// no ownership transfer in this product: the role list is a literal two-element
// array of Player and Administrator, there is no Owner option anywhere, and the
// bundle holds no transfer mutation. A team changes hands only by being created
// unowned and then claimed. The last shot is the evidence for that negative.
//
// Nothing is claimed. The Claim Team dialog is photographed and cancelled, and
// the "after" is KB 07 Albion, which scripts/seed-07.mjs created unclaimed and
// then had Mo claim.
//
// One account throughout: Mo can search for the unclaimed team, open it, open
// its dialog, and see the claimed one in his own list.

import { test, expect } from '@playwright/test';
import {
  shot, quiet07, signInAs, unstickHeader, onScreen, openDialog, centre,
  fixtures07, teamListReady, teamRow, teamPageReady, teamJoinedSince,
  teamCard, memberRowMenu, openSelect,
  searchBox, searchResults, hideNotificationBadge, hideSidebarIdentity,
  sidebarIdentity, notificationBadge,
  KB07, KB07_PROFILES, KB07_TEAMS,
} from '../../lib/kb';

const MO = `${KB07_PROFILES.pro.name} ${KB07_PROFILES.pro.lastName}`;

test.describe('07.9 Claiming a team', () => {
  test('finding an unclaimed team, its dialog, and one already claimed', async ({ page }) => {
    const fx = await fixtures07();

    await signInAs(page, KB07.pro, '/teams');
    await quiet07(page);
    await teamListReady(page);
    await unstickHeader(page);
    const masks = [sidebarIdentity(page, MO), notificationBadge(page)];

    // 01 - how you find one. An unclaimed team is in NO team list, not even its
    // creator's, so search is the only route to it. Fewer than three characters
    // is refused client-side.
    //
    // Captured as a viewport: the results list is portalled, so no element holds
    // both the box and the list.
    //
    // The badge AND the name are hidden rather than masked. The open dropdown
    // covers that part of the sidebar, so a mask paints its block at coordinates
    // that are now underneath the list - the first run of this shot came back
    // with a black bar straight across the search result.
    await hideNotificationBadge(page);
    await hideSidebarIdentity(page, MO);
    await searchBox(page).fill(KB07_TEAMS.orient);
    const results = searchResults(page);
    const hit = results.getByText(KB07_TEAMS.orient, { exact: true }).first();
    await expect(hit).toBeVisible({ timeout: 30_000 });
    await expect(results.getByText('Unclaimed', { exact: true }).first()).toBeVisible();
    await shot(page, '07.9', '01-search-result', { annotate: results });

    // 02 - the team itself. "Unclaimed Team" where an ordinary team says "Team",
    // and Claim Team where an owner would see Create Match and Invite Player.
    await page.goto(`/teams/${fx.teams.orient}`);
    await quiet07(page);
    await teamPageReady(page, KB07_TEAMS.orient);
    const unclaimed = onScreen(page.getByText('Unclaimed Team', { exact: true })).first();
    await expect(unclaimed).toBeVisible();
    const claim = page.getByRole('button', { name: 'Claim Team', exact: true });
    await shot(page, '07.9', '02-unclaimed-page', {
      annotate: claim, mask: [...masks, teamJoinedSince(page)],
    });

    // 03 - the dialog, and the warning it carries.
    await claim.click();
    const dialog = openDialog(page);
    await expect(dialog.getByText(/By claiming this team, you confirm that you own it/)).toBeVisible();
    await shot(page, '07.9', '03-claim-dialog', { clip: dialog });

    // 04 - the button that would do it. NOT clicked: a claim cannot be undone,
    // and this team is the fixture 07.2 photographs as well.
    const confirm = dialog.getByRole('button', { name: 'Claim', exact: true });
    await shot(page, '07.9', '04-claim-cancel', { clip: dialog, annotate: confirm });
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);

    // 05 - the "after". KB 07 Albion was unclaimed until Mo claimed it, and it is
    // now an ordinary team in his list with him as Owner.
    await page.goto('/teams');
    await quiet07(page);
    await teamListReady(page, [KB07_TEAMS.albion]);
    await unstickHeader(page);
    const row = teamRow(page, KB07_TEAMS.albion);
    await expect(row).toContainText('Owner');
    await centre(row);
    await shot(page, '07.9', '05-claimed-in-your-list', { annotate: row, mask: masks });

    // 06 - and why claiming is the ONLY way a team changes hands. The role list
    // on an existing member offers two options and neither of them is Owner.
    await page.goto(`/teams/${fx.teams.united}/settings`);
    await quiet07(page);
    await expect(page.getByText(`Edit Team - ${KB07_TEAMS.united}`)).toBeVisible();
    await unstickHeader(page);
    await centre(await teamCard(page, 'TEAM PLAYERS'));
    await memberRowMenu(page, KB07.player).click();
    await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
    const editDialog = openDialog(page);
    const role = editDialog.locator('[role="combobox"]').nth(1);
    const list = await openSelect(page, role);
    await expect(list.locator('[role="option"]')).toHaveCount(2);
    await expect(list).not.toContainText('Owner');
    await shot(page, '07.9', '06-role-list-no-owner', { mask: masks });
  });
});
