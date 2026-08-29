// 07.8 - Removing a member, and blocking them.
//
// The most careful spec in the collection. Both menu items fire on the click -
// there is no "are you sure" for either - and exploration proved it the hard
// way, by removing Pat from KB 07 United and forcing a rebuild of the fixture.
// So this spec opens the menu, photographs it, and never selects anything.
//
// The "after" is KB 07 Athletic, which the seed built with Baz already removed
// AND blocked and Ivy already removed plainly. Nothing renders a removed row, so
// what that fixture shows is an absence.
//
// The last shot IS produced live, and it is safe: a blocked person selecting
// "Join team" is refused by the API, so the click changes nothing at all.

import { test, expect } from '@playwright/test';
import {
  shot, quiet07, signInAs, unstickHeader, onScreen, openDialog, centre,
  fixtures07, teamCard, memberRow, memberRowMenu,
  asUser, mintSession,
  sidebarIdentity, notificationBadge,
  KB07, KB07_PROFILES, KB07_TEAMS,
} from '../../lib/kb';

const MO = `${KB07_PROFILES.pro.name} ${KB07_PROFILES.pro.lastName}`;
const BAZ = `${KB07_PROFILES.blocked.name} ${KB07_PROFILES.blocked.lastName}`;

test.describe('07.8 Removing a member, and blocking them', () => {
  test('the two menu items, and the team afterwards', async ({ page }) => {
    const fx = await fixtures07();

    await signInAs(page, KB07.pro, `/teams/${fx.teams.united}/settings`);
    await quiet07(page);
    await expect(page.getByText(`Edit Team - ${KB07_TEAMS.united}`)).toBeVisible();
    await unstickHeader(page);
    const masks = [sidebarIdentity(page, MO), notificationBadge(page)];

    // 01 - the menu on a member's row. Portalled outside the row, so no clip
    // holds both: captured as a viewport with the row centred first.
    const row = memberRow(page, KB07.player);
    await centre(row);
    await memberRowMenu(page, KB07.player).click();
    const remove = page.getByRole('menuitem', { name: 'Remove from team', exact: true });
    const block = page.getByRole('menuitem', { name: 'Remove & Block', exact: true });
    await expect(remove).toBeVisible();
    await expect(block).toBeVisible();
    await shot(page, '07.8', '01-member-menu', { mask: masks });

    // 02 and 03 - the two irreversible items, one at a time. NEITHER is clicked:
    // both act immediately, with no confirmation.
    await shot(page, '07.8', '02-remove-from-team', { annotate: remove, mask: masks });
    await shot(page, '07.8', '03-remove-and-block', { annotate: block, mask: masks });

    // 04 - the "after". KB 07 Athletic has had two people removed and shows no
    // trace of either: the rows survive in the API flagged isDeleted and nothing
    // in the app renders them. There is no blocked-members list to photograph.
    //
    // Asserted through the API as well as on screen, because the whole point of
    // this shot is what is NOT in it.
    const token: string = (await mintSession(KB07.pro)).idToken;
    const rows = (await asUser(token, `/teams/${fx.teams.athletic}/players?includeFans=true`)).body?.data ?? [];
    const gone = rows.filter((m: any) => m.isDeleted);
    expect(gone.length).toBe(2);
    expect(gone.filter((m: any) => m.isBlocked).length).toBe(1);

    await page.goto(`/teams/${fx.teams.athletic}/settings`);
    await quiet07(page);
    await expect(page.getByText(`Edit Team - ${KB07_TEAMS.athletic}`)).toBeVisible();
    await unstickHeader(page);
    const players = await teamCard(page, 'TEAM PLAYERS');
    await expect(players).not.toContainText(BAZ);
    await expect(players).not.toContainText('Ivy KB');
    await centre(players);
    await shot(page, '07.8', '04-after-removal', { clip: players });
  });

  // Baz, who was removed AND blocked from KB 07 Athletic. Its invitation link
  // opens for him like anybody else's; the block bites when he selects Join team.
  //
  // Safe to submit: POST /team-players/join/:shareCode answers 400 and writes
  // nothing. Verified on the wire before this spec was written.
  test('what a blocked person sees', async ({ page }) => {
    const fx = await fixtures07();
    const token: string = (await mintSession(KB07.pro)).idToken;
    const code = (await asUser(token, `/teams/${fx.teams.athletic}/shareCode`)).body?.data?.shareCode;
    expect(code).toBeTruthy();

    await signInAs(page, KB07.blocked, `/teams/${fx.teams.athletic}?shareCode=${code}`);
    const dialog = openDialog(page);
    await expect(dialog.getByText('Join Team', { exact: true })).toBeVisible();
    await quiet07(page);

    await dialog.getByRole('button', { name: 'Join team', exact: true }).click();
    // The refusal renders INSIDE the dialog, not as a toast - which matters,
    // because quiet07() hides toasts and would have hidden it.
    const refusal = dialog.getByText('You are blocked from joining this team.');
    await expect(refusal).toBeVisible({ timeout: 30_000 });
    // 05 - what a blocked person gets. Nothing changed: the call was refused.
    await shot(page, '07.8', '05-blocked-refusal', { clip: dialog, annotate: refusal });
  });
});
