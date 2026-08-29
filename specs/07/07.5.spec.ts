// 07.5 - Inviting players to your team.
//
// Three ways in, and only two of them work. Nothing is submitted: the filled
// dialog is photographed and abandoned, and the "after" - a member whose
// invitation is still pending - is Fin's row on KB 07 United, which
// scripts/seed-07.mjs leaves pending on purpose.
//
// The one write this spec does make is `POST /team-players/invite/:id`, fired by
// opening a name-only member's own invitation link. It mints a `teamInvitationId`
// against a row that already exists; it adds nobody and shows nowhere.
//
// **The share code is deliberately NOT masked.** docs/style-guide.md masks share
// codes "unless the share code is the subject", and here it is: the article is
// about the link you send somebody. It belongs to a staging team that exists only
// for these screenshots.

import { test, expect } from '@playwright/test';
import {
  shot, quiet07, signInAs, unstickHeader, onScreen, openDialog, centre,
  fixtures07, teamCard, memberRow, openSelect,
  sidebarIdentity, notificationBadge,
  KB07, KB07_PROFILES, KB07_TEAMS,
} from '../../lib/kb';

const MO = `${KB07_PROFILES.pro.name} ${KB07_PROFILES.pro.lastName}`;
const FRIEND_ROW = 'Sam KB';

test.describe('07.5 Inviting players to your team', () => {
  test('by email, by link, and the member who has not accepted yet', async ({ page }) => {
    const fx = await fixtures07();

    await signInAs(page, KB07.pro, `/teams/${fx.teams.united}/settings`);
    await quiet07(page);
    await expect(page.getByText(`Edit Team - ${KB07_TEAMS.united}`)).toBeVisible();
    await unstickHeader(page);
    const masks = [sidebarIdentity(page, MO), notificationBadge(page)];

    // 01 - where the control is.
    const players = await teamCard(page, 'TEAM PLAYERS');
    const addNew = players.getByRole('button', { name: 'Add New Player', exact: true });
    await centre(players);
    await shot(page, '07.5', '01-add-new-player', { clip: players, annotate: addNew });

    await addNew.click();
    const dialog = openDialog(page);
    await expect(dialog.getByText('Add New Player', { exact: true })).toBeVisible();
    // 02 - the dialog, showing all three ways in at once.
    await shot(page, '07.5', '02-add-player-dialog', { clip: dialog });

    // 03 - a name and an address. Not submitted.
    const name = dialog.getByPlaceholder('Enter name');
    const email = dialog.getByPlaceholder('Enter email address');
    await name.fill('Tara KB');
    await email.fill('kb-07-tara@yopmail.com');
    await shot(page, '07.5', '03-name-and-email', {
      clip: dialog, annotate: name.locator('xpath=ancestor::div[2]'),
    });

    // 04 - the Role list. Two options and no more: Player and Administrator.
    // Captured as a viewport, because the list is portalled outside the dialog.
    // The Role control is the SECOND combobox - the first is the friend list.
    const role = dialog.locator('[role="combobox"]').nth(1);
    const list = await openSelect(page, role);
    await expect(list.getByText('Player', { exact: true })).toBeVisible();
    await expect(list.getByText('Administrator', { exact: true })).toBeVisible();
    await shot(page, '07.5', '04-role-list', { mask: masks });
    await list.getByText('Player', { exact: true }).first().click();

    // 06 and 07 - the invitation link. Taken before the dialog is abandoned.
    await dialog.getByText('Generate invitation link', { exact: true }).click();
    await expect(dialog.getByText('Send Team Invitation')).toBeVisible();
    const link = dialog.locator('input').first();
    await expect(link).toHaveValue(/shareCode=/);
    await shot(page, '07.5', '06-invitation-link', { clip: dialog });
    const copy = dialog.getByText('Copy link', { exact: true });
    await shot(page, '07.5', '07-copy-link', { clip: dialog, annotate: copy });

    // Abandoned. Nobody was added.
    await page.getByRole('button', { name: 'Close' }).first().click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);

    // 05 - the "after", which the seed already built: Fin is on the team sheet
    // but has not accepted, and his row carries a different icon from everybody
    // else's. Clipped to the whole card so both states are in one frame.
    const finRow = memberRow(page, KB07.fresh);
    await expect(finRow).toBeVisible();
    const card = await teamCard(page, 'TEAM PLAYERS');
    await centre(card);
    await shot(page, '07.5', '05-pending-member', { clip: card, annotate: finRow });

    // 08 - a member added by NAME has no address to invite, so their row carries
    // an Invite button of its own.
    const samRow = memberRow(page, FRIEND_ROW);
    const invite = samRow.getByRole('button', { name: 'Invite', exact: true });
    await expect(invite).toBeVisible();
    await centre(samRow);
    await shot(page, '07.5', '08-row-invite-button', { clip: samRow, annotate: invite });

    // 09 - and it makes a DIFFERENT link: ?inviteCode=<teamInvitationId>, from
    // POST /team-players/invite/:teamPlayerId, bound to that one row.
    await invite.click();
    const d2 = openDialog(page);
    await expect(d2.getByText('Invite Player', { exact: true })).toBeVisible();
    await d2.getByText('Generate invitation link', { exact: true }).click();
    const memberLink = d2.locator('input').first();
    await expect(memberLink).toHaveValue(/inviteCode=/, { timeout: 30_000 });
    await shot(page, '07.5', '09-member-invite-link', { clip: d2 });
  });
});
