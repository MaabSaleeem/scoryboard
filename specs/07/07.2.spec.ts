// 07.2 - Dummy teams and unowned teams.
//
// The two checkboxes on the Add Team dialog, and the two kinds of team they
// make. Neither is created here: KB 07 Reserves (dummy) and KB 07 Orient
// (unclaimed) are seeded, and the dialog is photographed with the boxes ticked
// and then abandoned. Ticking a checkbox writes nothing.
//
// The checkboxes are named the opposite way round from the fields they set -
// "Create a Dummy team" carries id="isPrivate" and "I don't want to own this
// team" carries id="isSystem". The spec asserts the ids so that a rename in the
// app fails here rather than quietly mislabelling the article.
//
// Two personas, and therefore TWO tests. A spec cannot switch accounts inside
// one test: signInAs() mints a fresh session but the context still carries the
// first account's, and the app stays signed in as whoever got there first. Each
// test() gets its own context (playwright.config.ts sets an empty storageState),
// so the second account goes in its own test. Cost one failed run to find.

import { test, expect } from '@playwright/test';
import {
  shot, quiet07, signInAs, unstickHeader, onScreen, openDialog, centre,
  fixtures07, teamListReady, teamRow, teamPageReady, teamJoinedSince,
  sidebarIdentity, notificationBadge,
  KB07, KB07_PROFILES, KB07_TEAMS,
} from '../../lib/kb';

const MO = `${KB07_PROFILES.pro.name} ${KB07_PROFILES.pro.lastName}`;
const NIA = `${KB07_PROFILES.heir.name} ${KB07_PROFILES.heir.lastName}`;

test.describe('07.2 Dummy teams and unowned teams', () => {
  test('the two checkboxes, and the teams they make', async ({ page }) => {
    const fx = await fixtures07();

    await signInAs(page, KB07.pro, '/teams');
    await quiet07(page);
    await teamListReady(page, [KB07_TEAMS.united, KB07_TEAMS.reserves]);
    await unstickHeader(page);
    const masks = [sidebarIdentity(page, MO), notificationBadge(page)];

    await page.getByRole('button', { name: 'Add Team', exact: true }).click();
    const dialog = openDialog(page);
    const dummy = dialog.locator('#isPrivate');
    const unowned = dialog.locator('#isSystem');
    // The article's whole point is which box does what. Assert the labels sit
    // beside the ids the seed relies on.
    await expect(dummy.locator('xpath=..')).toContainText('Create a Dummy team');
    await expect(unowned.locator('xpath=..')).toContainText("I don't want to own this team");

    // 01 - both boxes, clear, so the reader can see the pair before either is
    // explained. Clipped to the dialog; the list behind it is not the subject.
    const pair = dummy.locator('xpath=ancestor::div[2]');
    await shot(page, '07.2', '01-both-checkboxes', { clip: dialog, annotate: pair });

    // 02 - Create a Dummy team, ticked. Nothing is submitted.
    await dummy.click();
    await expect(dummy).toHaveAttribute('aria-checked', 'true');
    await shot(page, '07.2', '02-dummy-ticked', { clip: dialog, annotate: dummy.locator('xpath=..') });

    // 03 - what a dummy team looks like in your OWN list: a Dummy badge beside
    // the size and the role. Close the dialog first - it is portalled over the
    // list and would sit in the middle of the frame.
    await page.getByRole('button', { name: 'Close' }).first().click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);
    const reserves = teamRow(page, KB07_TEAMS.reserves);
    await expect(reserves).toContainText('Dummy');
    await centre(reserves);
    await shot(page, '07.2', '03-dummy-in-your-list', { annotate: reserves, mask: masks });

  });

  // Nia, not Mo: the owner can never see either of these screens.
  test('what somebody else sees', async ({ page }) => {
    const fx = await fixtures07();

    // 04 - a dummy team is invisible to everybody but its owner.
    await signInAs(page, KB07.heir, `/teams/${fx.teams.reserves}`);
    await quiet07(page);
    // Upper case on screen is a CSS text-transform here too, so match the DOM's
    // own casing - the same trap collections 14 and 01 hit on GROUP A and
    // DELETE ACCOUNT.
    await expect(onScreen(page.getByText(/^dummy team$/i)).first()).toBeVisible();
    // Matched on a fragment: the sentence carries a typographic apostrophe and
    // wraps, so a longer pattern can fall foul of either.
    await expect(onScreen(page.getByText(/permission to view it/)).first()).toBeVisible();
    await shot(page, '07.2', '04-dummy-no-permission', {
      mask: [sidebarIdentity(page, NIA), notificationBadge(page)],
    });

    // 05 - the other checkbox's result: a team that belongs to nobody. It is in
    // no team list at all, so it is reached by id - which is what a search
    // result gives you. 07.9 shows the search.
    await page.goto(`/teams/${fx.teams.orient}`);
    await quiet07(page);
    await teamPageReady(page, KB07_TEAMS.orient);
    const unclaimed = onScreen(page.getByText('Unclaimed Team', { exact: true })).first();
    await expect(unclaimed).toBeVisible();
    await expect(page.getByRole('button', { name: 'Claim Team', exact: true })).toBeVisible();
    await shot(page, '07.2', '05-unclaimed-team-page', {
      annotate: unclaimed,
      mask: [sidebarIdentity(page, NIA), notificationBadge(page), teamJoinedSince(page)],
    });
  });
});
