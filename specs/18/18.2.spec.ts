// 18.2 - Creating and setting up a group chat.
//
// The only spec in this collection that creates anything. It builds a group,
// photographs the four wizard steps that made it and the two screens that come
// after, then deletes it.
//
// Deleting it is not tidiness. The wizard's first two steps are the same
// whatever exists, but the seeded group KB Sunday Squad is photographed by three
// other articles, and a second group in the same list would change its
// conversation list in all of them. So this one is disposed of, and disposed of
// at the START as well as the end: a run that dies in the middle would otherwise
// leave a group behind, and the next run would create a second with the same
// name.
//
// Role: everything in Group Info except the member list and Leave group is
// admin-only. Whoever creates a group is its admin, which is why this article
// and 18.4 are two halves of one fact.

import { test, expect } from '@playwright/test';
import {
  shot, context18, openGroupInfo, groupInfoPanel, panelFor, wizardOption,
  conversationHeader,
  sidebarIdentity18, deleteGroupByTitle, fixtures18,
  KB18, KB18_TEAMS, KB18_SPEC_GROUP, KB18_PROFILES,
} from '../../lib/kb';

test.describe('18.2 Creating and setting up a group chat', () => {
  test('the four wizard steps, the new group, and what an admin may change', async ({ browser }) => {
    const fx = await fixtures18();
    const proToken = fx.sessions.pro.token;
    const title = KB18_SPEC_GROUP.title;
    const invited = KB18_SPEC_GROUP.members.map((k) => `${KB18_PROFILES[k].name} ${KB18_PROFILES[k].lastName}`);

    // Anything a previous run left behind.
    await deleteGroupByTitle(proToken, title);

    const pru = await context18(browser, KB18.pro);
    try {
      const page = pru.page;

      // --- step 1: what kind of chat ---------------------------------------
      await page.getByRole('button', { name: 'Start a new chat' }).click();
      const kind = panelFor(page, 'Start New Chat');
      await expect(kind).toBeVisible({ timeout: 20_000 });
      // The wizard fetches the teams, leaderboards and players for its LATER
      // steps as soon as it opens, and renders their skeletons behind the first
      // one. Twenty-one of them were on screen when this capture first ran, and
      // shot()'s backstop threw. They are not visible in the frame, but they are
      // proof the window is still settling.
      await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 30_000 });
      await shot(page, '18.2', '01-start-new-chat', {
        clip: kind,
        clipPad: 8,
        annotate: wizardOption(page, 'Start a group with one or more players'),
      });

      // --- step 2: where to find the players --------------------------------
      await wizardOption(page, 'Start a group with one or more players').click();
      const source = panelFor(page, 'Select Players');
      await expect(source).toBeVisible({ timeout: 20_000 });
      await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 30_000 });
      // All four sources are on screen, and three of them are empty on an
      // account with no team, no leaderboard and no friends. Pru has all three
      // for exactly this capture.
      await expect(wizardOption(page, 'Browse players from your leaderboards')).toBeVisible();
      await expect(wizardOption(page, 'Choose players from your friends list')).toBeVisible();
      await shot(page, '18.2', '02-find-player-from', {
        clip: source,
        clipPad: 8,
        annotate: wizardOption(page, 'Browse players from your teams'),
      });

      // --- step 3: pick the players ------------------------------------------
      await wizardOption(page, 'Browse players from your teams').click();
      const teams = panelFor(page, 'Choose Team');
      await expect(teams).toBeVisible({ timeout: 20_000 });
      await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 30_000 });
      // "Teams" is also a sidebar link and KB Chat FC is also a row on other
      // screens, so scope the click to the window rather than to the page.
      await teams.getByText(KB18_TEAMS.chat, { exact: true }).click();

      const players = panelFor(page, 'Select Players');
      await expect(players).toBeVisible({ timeout: 20_000 });
      await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 30_000 });
      for (const name of invited) {
        await players.getByRole('button').filter({ hasText: name }).first().click();
      }
      const next = page.getByRole('button', { name: 'Next', exact: true });
      await expect(next).toBeEnabled();
      await shot(page, '18.2', '03-select-players', {
        clip: players,
        clipPad: 8,
        annotate: next,
      });

      // --- step 4: name it ---------------------------------------------------
      await next.click();
      const details = panelFor(page, 'Create Group Chat');
      await expect(details).toBeVisible({ timeout: 20_000 });
      await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 30_000 });
      const nameField = page.getByPlaceholder('Group name');
      await nameField.fill(title);
      // The counter is part of what this capture shows, so prove it has caught
      // up with the typing before the shutter.
      await expect(page.getByText(`${title.length}/80 characters`)).toBeVisible();
      await expect(page.getByText(`Participants (${invited.length})`)).toBeVisible();
      await shot(page, '18.2', '04-group-details', {
        clip: details,
        clipPad: 8,
        annotate: nameField,
      });

      // --- the group itself ---------------------------------------------------
      await page.getByRole('button', { name: 'Create chat', exact: true }).click();
      // Gate on the WINDOW being gone and the new group being the open
      // conversation.
      //
      // The obvious gate - "Pru KB created the group" - is wrong here, and it
      // published a screenshot of the wizard mid-submit, button reading
      // "Creating group...", over the seeded group behind it. KB Sunday Squad
      // opens with that same system line, so the assertion was already true
      // before the click. Every system line in this collection is like that:
      // they name the person, not the group.
      await expect(page.getByRole('button', { name: 'Create chat', exact: true }))
        .toBeHidden({ timeout: 30_000 });
      await expect(conversationHeader(page, title)).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText('Pru KB created the group')).toBeVisible({ timeout: 30_000 });
      for (const name of invited) {
        // .last(), because the newest system line is ALSO the conversation
        // row's preview text in the list to the left, and a bare getByText
        // matches both. The transcript is the later of the two in the DOM.
        await expect(page.getByText(`${name} joined the group`).last())
          .toBeVisible({ timeout: 30_000 });
      }
      await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 30_000 });
      await shot(page, '18.2', '05-group-created', {
        mask: [sidebarIdentity18(page, 'Pru KB')],
      });

      // --- Group Info, as its admin -------------------------------------------
      await openGroupInfo(page, title);
      await expect(page.getByRole('button', { name: 'Edit group name' })).toBeVisible();
      await expect(page.getByText('Announcement only', { exact: true })).toBeVisible();
      // The Admin badge against Pru, and a per-member menu against everybody
      // else. Both are what makes this the admin's view rather than a member's.
      await expect(page.getByText('Admin', { exact: true }).locator('visible=true').first()).toBeVisible();
      await expect(page.getByRole('button', { name: 'Member actions' })).toHaveCount(invited.length);
      await shot(page, '18.2', '06-group-info-admin', {
        clip: groupInfoPanel(page),
        clipPad: 8,
        annotate: page.getByRole('button', { name: 'Add', exact: true }),
      });
    } finally {
      await pru.ctx.close();
      // Runs whether the spec passed or failed. The seeded group is what every
      // other article photographs and it must be the only group on this list.
      await deleteGroupByTitle(proToken, title);
    }

    // Prove the disposal worked, rather than assuming it.
    const after = await fixtures18();
    expect(after.groupId).toBeTruthy();
  });
});
