// 05.3 - Merging a friend with an existing player when emails clash.
//
// You typed somebody in by hand months ago. Now you know their address, you put
// it on their friend record, and the app tells you that address already belongs
// to a player. Saying Yes replaces the placeholder with the real person.
//
// --- why this spec stops at the confirm --------------------------------------
//
// **The merge cannot be undone in the app.** Once the row stands for a real
// account its Edit control is greyed out, so there is no screen that can put
// the placeholder name back. docs/style-guide.md, "Actions you can only do
// once": photograph the dialog, do not submit it, and take the "after" state
// from a second fixture that is already in it.
//
// So the fourth capture is LINKED_FRIEND - a row the seed built by playerId,
// which is exactly what a merged row becomes. The article says so in the step
// text rather than implying the row in the picture is the one from step 3.
//
// Nothing in this file writes anything. The PUT in step 2 is refused with a
// 400, which is what opens the dialog in step 3, and the dialog is closed
// rather than confirmed.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, blockPromos, shot, onScreen, asUser, fixtures05, friendListReady,
  friendRow, openFriendMenu, topDialog, closeDialogs, hideSidebarIdentity, KB05,
} from '../../lib/kb';

const ARTICLE = '05.3';
const PAD = 20;

test.describe('05.3 Merging a friend with an existing player', () => {
  test('the clash, the prompt, and what a linked row looks like', async ({ page }) => {
    test.setTimeout(240_000);
    const fx = await fixtures05();

    // The address the article types has to belong to a real account that is NOT
    // already on this list, or the clash the article is about is a different
    // clash. fixtures05() reads the list, so this is checked rather than
    // assumed.
    expect([...fx.friends.values()].map((f: any) => f.email))
      .not.toContain(KB05.ACCOUNTS.player);

    await blockPromos(page);
    await signInAs(page, fx.free.email, '/friendList');
    await quiet(page);
    await friendListReady(page);
    await hideSidebarIdentity(page, 'Marc KB');

    // 1. The Edit dialog on a friend you typed in by hand.
    const menu = await openFriendMenu(page, KB05.MERGE_FRIEND);
    await menu.getByRole('menuitem', { name: KB05.ROW_MENU.edit }).click();
    const edit = topDialog(page);
    await expect(edit.getByText(KB05.EDIT_DIALOG.title, { exact: true })).toBeVisible();
    await expect(edit.locator('input[name="name"]')).toHaveValue(KB05.MERGE_FRIEND);
    await expect(edit.locator('input[name="email"]')).toHaveValue('');
    await shot(page, ARTICLE, '01-edit-friend', { clip: edit, clipPad: PAD });

    // 2. The address typed in, before it is saved.
    await edit.locator('input[name="email"]').fill(KB05.ACCOUNTS.player);
    const update = edit.getByRole('button', { name: KB05.EDIT_DIALOG.submit, exact: true });
    await shot(page, ARTICLE, '02-email-typed', {
      clip: edit, clipPad: PAD, annotate: update, annotatePad: 6,
    });

    // 3. The prompt. PUT /friends/:id answers 400 "A player with this email
    //    already exists." and the app turns that into this question.
    await update.click();
    const prompt = onScreen(
      page.locator('[role="dialog"]').filter({ hasText: KB05.MERGE_DIALOG.title }),
    ).first();
    await expect(prompt).toBeVisible();
    await expect(prompt.getByText(KB05.MERGE_DIALOG.question, { exact: true })).toBeVisible();
    // The address is interpolated into the sentence, so the two halves are
    // matched rather than the whole line.
    await expect(prompt).toContainText(KB05.MERGE_DIALOG.messageStart);
    await expect(prompt).toContainText(KB05.MERGE_DIALOG.messageEnd);
    await expect(prompt).toContainText(KB05.ACCOUNTS.player);
    await expect(prompt.getByRole('button', { name: KB05.MERGE_DIALOG.yes, exact: true }))
      .toBeVisible();
    await expect(prompt.getByRole('button', { name: KB05.MERGE_DIALOG.no, exact: true }))
      .toBeVisible();
    await shot(page, ARTICLE, '03-email-already-exists', { clip: prompt, clipPad: PAD });

    // Yes is never selected. It would link this row to a real account for good,
    // and 05.2's eighth capture and this article's fourth both depend on the
    // list having exactly one linked row and one editable placeholder.
    await closeDialogs(page);

    // 4. What the row becomes. LINKED_FRIEND is a row that already stands for a
    //    real account: it carries that person's own name and address, its Chat
    //    is live, and its Edit is greyed out.
    await friendListReady(page);
    const linked = friendRow(page, KB05.LINKED_FRIEND);
    await expect(linked).toBeVisible();
    await expect(linked.getByRole('button', { name: KB05.CHAT_BUTTON })).toBeEnabled();
    // No clipPad here. The pad exists to keep a dimmed page out of a modal's
    // rounded corners; this row sits on the ordinary page, and 12px of pad
    // caught a sliver of the rows above and below it.
    await shot(page, ARTICLE, '04-linked-row', { clip: linked });

    // The friend the steps edited is untouched: still a placeholder, still
    // editable. Proves the run left nothing behind.
    const rows = (await asUser(fx.free.token, '/friends')).body?.data ?? [];
    const merged = rows.find((f: any) => f.name === KB05.MERGE_FRIEND);
    expect(merged, `${KB05.MERGE_FRIEND} should still be a placeholder`).toBeTruthy();
    expect(merged.isRegistered).toBeFalsy();
    expect(merged.email ?? null).toBeNull();
  });
});
