// 05.2 - Adding, editing and removing friends.
//
// The procedure article. One friend is created, edited and removed inside this
// run, which is what makes the spec replayable: it ends with the list exactly
// as the seed built it, five rows, without anything having to be undone.
//
// The eighth capture is a second, separate point - a friend row that stands for
// a real Scoryboard account cannot be edited at all - so it sits under its own
// heading in the article and its own comment block here.
//
// Nothing in this file is a one-way action. Removing a friend is a soft delete
// and the friend removed is the one this run created.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, blockPromos, shot, onScreen, asUser, fixtures05, friendListReady,
  friendRow, openFriendMenu, topDialog, closeDialogs, openAddFriend, hideSidebarIdentity,
  deleteFriend, KB05,
} from '../../lib/kb';

const ARTICLE = '05.2';
const PAD = 20;

test.describe('05.2 Adding, editing and removing friends', () => {
  test('add a friend, change them, take them off the list', async ({ page }) => {
    test.setTimeout(300_000);
    const fx = await fixtures05();

    await blockPromos(page);
    await signInAs(page, fx.free.email, '/friendList');
    await quiet(page);
    await friendListReady(page);
    await hideSidebarIdentity(page, 'Marc KB');

    try {
      // 1. Where the control is.
      const addButton = onScreen(
        page.getByRole('button', { name: KB05.ADD_BUTTON, exact: true }),
      ).first();
      await expect(addButton).toBeVisible();
      await shot(page, ARTICLE, '01-friend-list', { annotate: addButton, annotatePad: 6 });

      // 2. The empty dialog. Both fields, and the invitation-link control that
      //    05.4 is about.
      const add = await openAddFriend(page);
      await expect(add.locator('input[name="name"]')).toHaveValue('');
      await expect(add.locator('input[name="email"]')).toHaveValue('');
      await shot(page, ARTICLE, '02-add-friend-dialog', { clip: add, clipPad: PAD });

      // 3. Filled in. The name is required, the email is not.
      await add.locator('input[name="name"]').fill(KB05.NEW_FRIEND.name);
      await add.locator('input[name="email"]').fill(KB05.NEW_FRIEND.email);
      const submit = add.getByRole('button', { name: KB05.ADD_DIALOG.submit, exact: true });
      await shot(page, ARTICLE, '03-add-friend-filled', {
        clip: add, clipPad: PAD, annotate: submit, annotatePad: 6,
      });
      await submit.click();

      // 4. The new row, at the end of the list.
      await expect(friendRow(page, KB05.NEW_FRIEND.name)).toBeVisible();
      await closeDialogs(page);
      const newRow = friendRow(page, KB05.NEW_FRIEND.name);
      await shot(page, ARTICLE, '04-new-friend-row', { annotate: newRow, annotatePad: 6 });

      // 5. The row menu.
      //
      // A viewport capture, not a clip: the menu is portalled out of the row and
      // a clip to the row would frame a floating list over a box that is not in
      // the picture. docs/style-guide.md makes the same call for every dropdown.
      const menu = await openFriendMenu(page, KB05.NEW_FRIEND.name);
      await shot(page, ARTICLE, '05-row-menu-open', { annotate: menu, annotatePad: 6 });

      // 6. The Edit dialog. Same two fields, prefilled.
      await menu.getByRole('menuitem', { name: KB05.ROW_MENU.edit }).click();
      const edit = topDialog(page);
      await expect(edit.getByText(KB05.EDIT_DIALOG.title, { exact: true })).toBeVisible();
      await expect(edit.locator('input[name="name"]')).toHaveValue(KB05.NEW_FRIEND.name);
      await expect(edit.locator('input[name="email"]')).toHaveValue(KB05.NEW_FRIEND.email);
      await shot(page, ARTICLE, '06-edit-friend-dialog', { clip: edit, clipPad: PAD });
      await closeDialogs(page);

      // 7. The removal confirm, and the warning it carries about teams.
      const menu2 = await openFriendMenu(page, KB05.NEW_FRIEND.name);
      await menu2.getByRole('menuitem', { name: KB05.ROW_MENU.remove }).click();
      const confirm = topDialog(page);
      await expect(confirm.getByText(KB05.REMOVE_DIALOG.title, { exact: true })).toBeVisible();
      await expect(confirm.getByText(KB05.REMOVE_DIALOG.message, { exact: true })).toBeVisible();
      await shot(page, ARTICLE, '07-remove-confirm', { clip: confirm, clipPad: PAD });

      // Confirmed on purpose. The friend being removed is the one this run
      // created, so performing the removal is what puts the fixture back rather
      // than what breaks it.
      await confirm.getByRole('button', { name: KB05.REMOVE_DIALOG.confirm, exact: true }).click();
      await expect(onScreen(page.getByText(KB05.NEW_FRIEND.name, { exact: true })))
        .toHaveCount(0);
      await closeDialogs(page);

      // 8. What you cannot edit.
      //
      // A row that stands for a real Scoryboard account has its Edit greyed out
      // - the name and the address are that person's to change, not yours -
      // while Remove stays live. Asserted on the attribute, not on the look.
      // The Chat half is asserted BEFORE the menu opens. Radix marks the rest of
      // the page aria-hidden while a menu is up, so getByRole finds nothing in
      // the row underneath it.
      await expect(friendRow(page, KB05.LINKED_FRIEND)
        .getByRole('button', { name: KB05.CHAT_BUTTON })).toBeEnabled();
      const linked = await openFriendMenu(page, KB05.LINKED_FRIEND);
      const disabledEdit = linked.getByRole('menuitem', { name: KB05.ROW_MENU.edit });
      await expect(disabledEdit).toHaveAttribute('aria-disabled', 'true');
      await expect(linked.getByRole('menuitem', { name: KB05.ROW_MENU.remove }))
        .not.toHaveAttribute('aria-disabled', 'true');
      await shot(page, ARTICLE, '08-edit-disabled-linked', {
        annotate: disabledEdit, annotatePad: 6,
      });
    } finally {
      // If the run died before step 7 confirmed, the friend it created is still
      // on the list and would appear in every other article's capture of it.
      const rows = (await asUser(fx.free.token, '/friends')).body?.data ?? [];
      const stray = rows.find((f: any) => f.name === KB05.NEW_FRIEND.name);
      if (stray) await deleteFriend(fx.free.token, String(stray.id));
    }
  });
});
