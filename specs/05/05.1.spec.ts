// 05.1 - What your friends list is and why teams depend on it.
//
// The concept article for this collection, and the one the map calls the
// highest ticket driver in this area. Three shots: the list, the Add To Team
// dialog a row opens, and the refusal a Free account meets when it asks for a
// second team.
//
// --- the one thing that makes this spec unusual -----------------------------
//
// **The third capture destroys a friend.** On Free a friend may belong to one
// of your teams only. Asking for a second answers 400 ONE_FRIEND_PER_TEAM and
// the server soft-deletes the friend record on the way out, so the person
// disappears from the friends list while staying on the team they were already
// on. Observed on staging 2026-08-30, from the API and through the app, and
// recorded in config/api.md. The article documents it, because a reader who
// runs into this gate loses a row and has no idea why.
//
// docs/style-guide.md: "a spec that consumes or mutates a fixture puts it back
// itself". reviveFriend() re-posts the same friendPlayerId, which brings the
// SAME record back - same id, same place in the list - so the other three
// articles photograph an unchanged list. It runs in a finally, so a failure
// between the refusal and the restore still leaves the fixture whole.
//
// Nothing else here writes anything: the Add To Team dialog in step 2 is opened
// and closed without being submitted.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, blockPromos, shot, onScreen, fixtures05, friendListReady, friendRow,
  topDialog, closeDialogs, hideSidebarIdentity, reviveFriend, KB05,
} from '../../lib/kb';

const ARTICLE = '05.1';

// Frame each dialog with a margin of the page it dimmed. A clip that hugs a
// rounded dialog catches a sliver of that dimmed page in the top corners, which
// reads as a smudge along the top edge. See ShotOptions.clipPad in lib/kb.ts.
const PAD = 20;

test.describe('05.1 What your friends list is', () => {
  test('the list, the team dialog and the Free refusal', async ({ page }) => {
    test.setTimeout(240_000);
    const fx = await fixtures05();
    const gate = fx.friend(KB05.GATE_FRIEND);
    let spent = false;

    await blockPromos(page);
    await signInAs(page, fx.free.email, '/friendList');
    await quiet(page);
    await friendListReady(page);
    await hideSidebarIdentity(page, 'Marc KB');

    try {
      // 1. The list itself, and the sidebar link that reaches it.
      //
      // A viewport capture rather than a clip to the list: the article's first
      // job is to say where the friends list is, and the sidebar is half of
      // that answer.
      const nav = page.locator('a[href="/friendList"]').first();
      await expect(nav).toBeVisible();
      for (const f of KB05.FRIENDS) {
        await expect(friendRow(page, f.name)).toBeVisible();
      }
      await shot(page, ARTICLE, '01-friend-list', { annotate: nav, annotatePad: 6 });

      // 2. What a friend row is for: Add To Team, on a friend who is on none of
      //    your teams, so both teams are offered.
      //
      // The dialog hides any team the player is already on - which is why this
      // step uses FREE_FRIEND and the next one uses GATE_FRIEND.
      await friendRow(page, KB05.FREE_FRIEND)
        .getByRole('button', { name: KB05.ADD_TO_TEAM.trigger }).click();
      const addToTeam = topDialog(page);
      await expect(addToTeam.getByText(KB05.ADD_TO_TEAM.title, { exact: true })).toBeVisible();
      await expect(addToTeam.getByText(KB05.ADD_TO_TEAM.lead, { exact: true })).toBeVisible();
      await expect(addToTeam.getByText(KB05.ADD_TO_TEAM.teamLabel, { exact: true })).toBeVisible();
      await shot(page, ARTICLE, '02-add-to-team', { clip: addToTeam, clipPad: PAD });
      await closeDialogs(page);

      // 3. The Free refusal.
      //
      // GATE_FRIEND is already on KB 05 FC, so the only team the dialog offers
      // is the other one - and asking for it is what raises the gate.
      await friendRow(page, KB05.GATE_FRIEND)
        .getByRole('button', { name: KB05.ADD_TO_TEAM.trigger }).click();
      const second = topDialog(page);
      await expect(second.getByText(KB05.ADD_TO_TEAM.title, { exact: true })).toBeVisible();
      await second.getByRole('combobox').first().click();
      await page.getByRole('listbox').getByText(KB05.TEAMS.other, { exact: true }).click();
      await expect(second.getByRole('combobox').first()).toContainText(KB05.TEAMS.other);

      spent = true;
      await second.getByRole('button', { name: KB05.ADD_TO_TEAM.submit, exact: true }).click();

      const gateModal = onScreen(
        page.locator('[role="dialog"]').filter({ hasText: KB05.TEAM_LIMIT_GATE.title }),
      ).first();
      await expect(gateModal).toBeVisible();
      // toContainText, not an exact getByText: the modal renders both
      // paragraphs inside one wrapper, so an exact match on either finds
      // nothing.
      await expect(gateModal).toContainText(KB05.TEAM_LIMIT_GATE.message);
      await expect(gateModal).toContainText(KB05.TEAM_LIMIT_GATE.detail);
      await expect(
        gateModal.getByRole('button', { name: KB05.TEAM_LIMIT_GATE.upgrade }),
      ).toBeVisible();
      // Never selected. It would turn the persona Pro and take every Free gate
      // in this collection with it.
      await shot(page, ARTICLE, '03-one-friend-per-team-free', {
        clip: gateModal, clipPad: PAD,
      });
      await closeDialogs(page);
    } finally {
      // Put the friend the refusal deleted back, at the same id and in the same
      // place in the list. Unconditional on `spent` being true would be wrong -
      // a run that failed before the submit has nothing to restore and the
      // revive would answer 200 for a record that was never removed - but it is
      // cheap and idempotent, so it runs whenever the submit was reached.
      if (spent) {
        await reviveFriend(fx.free.token, String(gate.friendPlayerId));
      }
    }
  });
});
