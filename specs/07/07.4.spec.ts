// 07.4 - Your team settings screen.
//
// A tour of the five cards on Edit Team, and what changes when you are not the
// Owner. Reads only: nothing here is typed, ticked or submitted.
//
// One test, two teams, one account. Mo owns KB 07 United and is an
// Administrator on KB 07 Wanderers, so the role half needs no second sign-in -
// which is just as well, because a spec cannot switch accounts inside one test.

import { test, expect } from '@playwright/test';
import {
  shot, quiet07, signInAs, unstickHeader, onScreen, centre,
  fixtures07, teamListReady, teamRow, teamRowMenu, teamCard,
  sidebarIdentity, notificationBadge,
  KB07, KB07_PROFILES, KB07_TEAMS,
} from '../../lib/kb';

const MO = `${KB07_PROFILES.pro.name} ${KB07_PROFILES.pro.lastName}`;

test.describe('07.4 Your team settings screen', () => {
  test('the five cards, and what an Administrator cannot do', async ({ page }) => {
    const fx = await fixtures07();

    await signInAs(page, KB07.pro, '/teams');
    await quiet07(page);
    await teamListReady(page);
    await unstickHeader(page);
    const masks = [sidebarIdentity(page, MO), notificationBadge(page)];

    // 01 - how you get there. The menu is portalled outside the row, so no clip
    // holds both the row and the menu: captured as a viewport.
    const row = teamRow(page, KB07_TEAMS.united);
    await centre(row);
    await teamRowMenu(page, KB07_TEAMS.united).click();
    const edit = page.getByRole('menuitem', { name: 'Edit', exact: true });
    await expect(edit).toBeVisible();
    await shot(page, '07.4', '01-row-menu', { annotate: edit, mask: masks });

    await edit.click();
    await page.waitForURL(`**/teams/${fx.teams.united}/settings`);
    await quiet07(page);
    await expect(page.getByText(`Edit Team - ${KB07_TEAMS.united}`)).toBeVisible();
    await expect(onScreen(page.getByText(/^delete team$/i)).first()).toBeVisible();
    await unstickHeader(page);

    // 02 - the whole page, so the reader knows how much there is. Full page: the
    // article documents the screen rather than one control, which is the one
    // case docs/style-guide.md allows it. unstickHeader() first, or the sticky
    // header is stitched into the middle of the image.
    await shot(page, '07.4', '02-edit-team-page', { fullPage: true, mask: masks });

    // 03 to 06 - one card each. None of them carries an id, so each is reached
    // from its own heading and asserted to still contain it.
    for (const [name, heading] of [
      ['03-profile-appearance', 'PROFILE APPEARANCE'],
      ['04-team-information', 'TEAM INFORMATION'],
      ['05-team-players', 'TEAM PLAYERS'],
      ['06-leaderboards', 'LEADERBOARDS'],
    ] as const) {
      const card = await teamCard(page, heading);
      await centre(card);
      await shot(page, '07.4', name, { clip: card });
    }

    // 07 - the same page on a team Mo does NOT own. Every card is there,
    // including DELETE TEAM, and its button is disabled: DELETE /teams/:id
    // answers 403 "Only team Owner can delete team" for an Administrator, so the
    // screen and the API agree.
    await page.goto(`/teams/${fx.teams.wanderers}/settings`);
    await quiet07(page);
    await expect(page.getByText(`Edit Team - ${KB07_TEAMS.wanderers}`)).toBeVisible();
    await unstickHeader(page);
    const deleteCard = await teamCard(page, 'DELETE TEAM');
    const button = deleteCard.getByRole('button', { name: 'Delete Team', exact: true });
    await expect(button).toBeDisabled();
    await centre(deleteCard);
    await shot(page, '07.4', '07-delete-disabled-for-admin', { clip: deleteCard, annotate: button });
  });
});
