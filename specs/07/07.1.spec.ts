// 07.1 - Creating a team.
//
// The one spec in this collection that writes anything. Creating a team is fully
// reversible - DELETE /teams/:id works on a team you own and nothing else depends
// on it - so this walks the real flow and then deletes what it made.
//
// It creates KB 07 Trialists, which is deliberately NOT in lib/fixtures-07.mjs:
// no other article photographs it, and the seed must never find it. The teardown
// runs at the START as well as the end, because the state a crashed run leaves
// behind is exactly what would make the next one create a second copy.

import { test, expect } from '@playwright/test';
import {
  shot, quiet07, signInAs, unstickHeader, onScreen, openDialog,
  fixtures07, teamListReady, teamRow, openSelect, centre,
  asUser, mintSession, sidebarIdentity, notificationBadge,
  KB07, KB07_PROFILES,
} from '../../lib/kb';

const NEW_TEAM = 'KB 07 Trialists';
const NEW_SIZE = '7 VS 7';
const ME = `${KB07_PROFILES.pro.name} ${KB07_PROFILES.pro.lastName}`;

/** Delete the team this spec creates, wherever the run got to. */
async function removeTrialists() {
  const token: string = (await mintSession(KB07.pro)).idToken;
  const teams = (await asUser(token, '/teams?all=true')).body?.data ?? [];
  for (const t of teams.filter((x: any) => x.name === NEW_TEAM)) {
    await asUser(token, `/teams/${t.teamId}`, { method: 'DELETE' });
  }
}

test.describe('07.1 Creating a team', () => {
  test('the Add Team dialog, and the team it makes', async ({ page }) => {
    await removeTrialists();
    const fx = await fixtures07();
    expect(fx.teams.united).toBeTruthy();

    await signInAs(page, KB07.pro, '/teams');
    await quiet07(page);
    await teamListReady(page);
    await unstickHeader(page);

    const identity = sidebarIdentity(page, ME);
    const badge = notificationBadge(page);
    const masks = [identity, badge];

    // 01 - where the reader starts. Not clipped: the article's first step is
    // "open Teams", and the sidebar is how you know you are on the right screen.
    const addTeam = page.getByRole('button', { name: 'Add Team', exact: true });
    await shot(page, '07.1', '01-manage-teams', { annotate: addTeam, mask: masks });

    await addTeam.click();
    const dialog = openDialog(page);
    await expect(dialog.getByText('Add Team', { exact: true })).toBeVisible();
    // 02 - the empty dialog, before anything is typed.
    await shot(page, '07.1', '02-add-team-dialog', { clip: dialog });

    // 03 - the name. The dialog's own subtitle warns the name must be unique.
    const name = dialog.getByPlaceholder('Team name');
    await name.fill(NEW_TEAM);
    await shot(page, '07.1', '03-team-name', { clip: dialog, annotate: name });

    // 04 - Team size has NO default. The "5 VS 5" on the closed control is
    // placeholder text; the hidden select's selected option is "". Captured as a
    // viewport because the list is portalled outside the dialog, so a clip to the
    // dialog would be a floating list over a box the reader cannot see - the same
    // call collection 01 made in 01.5.
    const size = dialog.locator('[role="combobox"]').first();
    await openSelect(page, size);
    // Masked even though this is a viewport shot of a dialog: the sidebar is
    // still in frame behind it, and the first run left the persona's name legible.
    await shot(page, '07.1', '04-team-size-list', { mask: masks });
    await page.locator('[role="listbox"]').getByText(NEW_SIZE, { exact: true }).first().click();
    await expect(size).toContainText(NEW_SIZE);

    // 05 - the crest. The input is hidden and carries the only label in the block.
    const crest = dialog.getByText("Upload team's Avatar", { exact: true });
    await shot(page, '07.1', '05-team-crest', { clip: dialog, annotate: crest });

    // 06 - the two checkboxes, both clear. They are 07.2's subject; here the
    // point is that an ordinary team leaves both alone.
    const dummy = dialog.locator('#isPrivate');
    const unowned = dialog.locator('#isSystem');
    await expect(dummy).toHaveAttribute('aria-checked', 'false');
    await expect(unowned).toHaveAttribute('aria-checked', 'false');
    const checkboxes = dummy.locator('xpath=ancestor::div[2]');
    await shot(page, '07.1', '06-checkboxes', { clip: dialog, annotate: checkboxes });

    // 07 - the completed dialog.
    const add = dialog.getByRole('button', { name: 'Add', exact: true });
    await shot(page, '07.1', '07-add-button', { clip: dialog, annotate: add });

    await add.click();
    // Gate on the new row, not on the dialog closing: the list refetches.
    const row = teamRow(page, NEW_TEAM);
    await expect(row).toBeVisible({ timeout: 30_000 });
    await expect(row).toContainText(NEW_SIZE);
    await expect(row).toContainText('Owner');
    // The list refetches after the create, so the crests drop back to initials
    // and have to be waited for again - teamListReady() does that as well as
    // proving the new row is there.
    await teamListReady(page, [NEW_TEAM]);
    await quiet07(page);
    await unstickHeader(page);
    // The new team lands at the FOOT of the list, which on this account is below
    // the fold - the first run of this shot cut the row's own "7 VS 7" and
    // "Owner" badges off the bottom edge. Centre it before the capture.
    await centre(row);
    // 08 - the new team in the list, owned by you.
    await shot(page, '07.1', '08-new-team-row', { annotate: row, mask: masks });

    // Put the account back. Creating is reversible; leaving it is not tidy.
    await removeTrialists();
  });
});
