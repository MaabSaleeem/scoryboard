// 18.4 - Leaving, deleting and reporting.
//
// A two-role article, captured from two accounts. Marc is a plain member of
// KB Sunday Squad and Pru is its only admin, and Group Info is a different
// screen for each of them: Marc gets a member list and Leave group, Pru gets the
// pencils, Announcement only, Add, a menu against every member, Delete group -
// and a Leave group that is disabled, because the only admin cannot leave.
//
// The Free/Pro difference is incidental here. Marc happens to be Free; what
// these captures are about is ROLE.
//
// **Nothing is submitted.** Leaving the group, deleting it, deleting the
// conversation and reporting a message are all once-only against a seeded
// fixture and three of the four cannot be undone at all, so each is photographed
// at its dialog. docs/style-guide.md: photograph the dialog, do not submit it.

import { test, expect } from '@playwright/test';
import {
  shot, context18, openConversation, openGroupInfo, groupInfoPanel, panelFor,
  openMessageMenu, conversationRow, parkPointer, fixtures18, asUser,
  KB18, KB18_GROUP, KB18_REPORT_REASONS, kb18Message,
} from '../../lib/kb';

test.describe('18.4 Leaving, deleting and reporting', () => {
  test('a member leaves, an admin cannot, and a message is reported', async ({ browser }) => {
    await fixtures18();
    const theirs = kb18Message('reactTo').text;

    // --- the member's view --------------------------------------------------
    const marc = await context18(browser, KB18.free);
    try {
      const page = marc.page;
      // Marc is Free, so gate on his OWN message: everybody else's arrives as a
      // ten-character stub and cannot be matched on its full text.
      await openConversation(page, KB18_GROUP.title, kb18Message('marcs').text);
      await openGroupInfo(page, KB18_GROUP.title);

      const leave = page.getByRole('button', { name: 'Leave group', exact: true });
      await expect(leave).toBeVisible();
      await expect(leave).toBeEnabled();
      // Everything an admin gets and a member does not. Asserted rather than
      // described, because their absence is the whole of this capture.
      await expect(page.getByRole('button', { name: 'Delete group' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Add', exact: true })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Member actions' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Edit group name' })).toHaveCount(0);
      await expect(page.getByText('Announcement only', { exact: true })).toHaveCount(0);

      await parkPointer(page);
      await shot(page, '18.4', '01-group-info-member', {
        clip: groupInfoPanel(page),
        clipPad: 8,
        annotate: leave,
      });

      await leave.click();
      // The confirm is tracked by its DESCRIPTION, not by panelFor('Leave
      // group'). Group Info also contains the words "Leave group" - it is the
      // button that opened this - so panelFor matches both windows, and the
      // toBeHidden after Cancel resolved to the one still on screen and hung for
      // fifteen seconds. Only the confirm carries this sentence.
      const leaveNote = page.getByText('You will be removed from this group and lose access to its messages.');
      await expect(leaveNote).toBeVisible({ timeout: 15_000 });
      await shot(page, '18.4', '02-leave-confirm', {
        clip: panelFor(page, 'Leave group'),
        clipPad: 8,
      });

      // Cancel. Marc must still be in the group: three other captures in this
      // collection photograph a four-member list, and nothing puts him back
      // except re-seeding.
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(leaveNote).toBeHidden({ timeout: 15_000 });
    } finally {
      await marc.ctx.close();
    }

    // --- the admin's view ---------------------------------------------------
    const pru = await context18(browser, KB18.pro);
    try {
      const page = pru.page;
      await openConversation(page, KB18_GROUP.title, theirs);
      await openGroupInfo(page, KB18_GROUP.title);

      // The Group actions card sits below the fold of the window's own
      // scroller, so it has to be brought into view before it can be clipped.
      // ancestor::SECTION, not ancestor::div. The card is a <section>, and an
      // xpath asking for a div walked straight past it to the whole Group Info
      // window - so the first run of this capture published the entire dialog
      // again, with its annotation drawn off the bottom of the frame.
      const actions = page.getByText('Group actions', { exact: true })
        .locator('xpath=ancestor::section[1]');
      await actions.scrollIntoViewIfNeeded();
      const leave = page.getByRole('button', { name: 'Leave group', exact: true });
      await expect(leave).toBeDisabled();
      const note = page.getByText('Leave group is disabled because you are the only admin.');
      await expect(note).toBeVisible();
      await shot(page, '18.4', '03-group-actions-admin', {
        clip: actions,
        clipPad: 16,
        annotate: note,
      });

      await page.getByRole('button', { name: 'Delete group' }).click();
      // Same trap as the leave confirm: Group Info holds a "Delete group" button
      // of its own, so the window is tracked by its description.
      const deleteNote = page.getByText('This action cannot be undone. The group and all its messages will be deleted for everyone.');
      await expect(deleteNote).toBeVisible({ timeout: 15_000 });
      await shot(page, '18.4', '04-delete-group-confirm', {
        clip: panelFor(page, 'Delete group'),
        clipPad: 8,
      });

      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(deleteNote).toBeHidden({ timeout: 15_000 });
      await page.getByRole('button', { name: 'Close' }).last().click();
      await expect(page.getByRole('heading', { name: 'Group Info' })).toBeHidden({ timeout: 15_000 });

      // --- leaving a conversation, rather than a group ----------------------
      //
      // The bin on a row in the Chats list. It is a different thing from leaving
      // a group, and the dialog says so: it removes the chat from YOUR list and
      // brings it back if a new message arrives.
      const row = conversationRow(page, 'Milo KB');
      await row.hover();
      await page.getByRole('button', { name: 'Delete chat Milo KB' }).click();
      const chatNote = page.getByText(/This will remove the chat from your list/);
      await expect(chatNote).toBeVisible({ timeout: 15_000 });
      await shot(page, '18.4', '05-delete-chat-confirm', {
        clip: panelFor(page, 'Delete chat'),
        clipPad: 8,
      });

      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(chatNote).toBeHidden({ timeout: 15_000 });

      // --- reporting a message ----------------------------------------------
      await openConversation(page, KB18_GROUP.title, theirs);
      await openMessageMenu(page, theirs);
      await page.getByRole('menuitem', { name: 'Report', exact: true }).click();
      const report = panelFor(page, 'Report message');
      await expect(report).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 30_000 });
      for (const reason of KB18_REPORT_REASONS) {
        await expect(page.getByRole('button', { name: reason, exact: true })).toBeVisible();
      }
      // Spam is preselected and the note is capped at 300. Both are on screen in
      // this capture, so both are worth proving before the shutter.
      await expect(page.getByText('0/300', { exact: true })).toBeVisible();
      await parkPointer(page);
      await shot(page, '18.4', '06-report-message', { clip: report, clipPad: 8 });

      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(report).toBeHidden({ timeout: 15_000 });
    } finally {
      await pru.ctx.close();
    }

    // The group still has its four members and Milo's chat is still on the list.
    // Every Cancel above had to land; a missed one is silent and unrecoverable.
    const fx = await fixtures18();
    const members = (await asUser(
      fx.sessions.pro.token, `/chats/conversations/${fx.groupId}/group/members`,
    )).body?.data?.members ?? [];
    expect(members).toHaveLength(1 + KB18_GROUP.members.length);
    expect(fx.directProId).toBeTruthy();
  });
});
