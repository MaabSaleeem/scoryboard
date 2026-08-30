// 05.4 - Invite codes and claiming your own record.
//
// Two links, and they are not the same link.
//
//   * Add Friend -> Generate invitation link makes your ACCOUNT's code, from
//     GET /friends/invite-code. Anybody who opens it and accepts is added to
//     your list as a new row.
//   * A friend row -> Edit -> Generate invitation link makes THAT ROW's code,
//     from GET /friends/:id/shareCode. Whoever opens it and accepts takes that
//     record over: the placeholder you typed becomes their account, with their
//     own name on it.
//
// Both links land on /friendList?shareCode=<code>&playerId=<yours> and both open
// the same "Friend List Invitation" dialog, which is why the article has to say
// which is which in words - the screen does not.
//
// --- three tests, because a spec cannot switch accounts inside one -----------
//
// signInAs() mints a fresh session but the context still holds the first one,
// and the app stays signed in as whoever got there first. Collection 07 learned
// that; here it is unavoidable, because the article's subject is what the OTHER
// person sees. Playwright gives each test its own context and the config runs
// them serially, in file order.
//
// --- what this spec changes, and how it puts it back ------------------------
//
// Test 2 accepts the invitation, which is a one-way action for that code: the
// record now belongs to a real account, so it has no Edit control and no share
// code any more. It cannot be revived, only replaced. afterAll deletes the
// claimed row and creates the placeholder again - which is why CLAIM_FRIEND is
// the LAST entry in KB05.FRIENDS: a new record lands at the end of the list,
// and anywhere else in the array it would reorder every other capture.
//
// The claimer's own account is left as it was. Claiming adds a row to the
// INVITER's list and nothing to the claimer's - friendship here is one-way.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, blockPromos, shot, onScreen, asUser, mintSession, fixtures05,
  friendListReady, friendRow, openFriendMenu, topDialog, closeDialogs, openAddFriend,
  invitePanel, friendShareLink, hideSidebarIdentity, hideLottie, deleteFriend, createFriend,
  KB05,
} from '../../lib/kb';

const ARTICLE = '05.4';
const PAD = 20;

/**
 * Marc's session and friends list, without the order assertion in fixtures05().
 *
 * Test 3 runs while the claimed row still reads "Nate KB" rather than
 * "Nia Halvorsen", so the strict fixture reader would throw on a fixture that
 * is exactly as this spec intends it to be.
 */
async function inviter() {
  const email: string = KB05.ACCOUNTS.free;
  const session = await mintSession(email);
  const me = (await asUser(session.idToken, '/users/me')).body?.data;
  if (!me) throw new Error(`${email} has no Scoryboard user. Run: node scripts/seed-05.mjs`);
  const rows = (await asUser(session.idToken, '/friends')).body?.data ?? [];
  return { email, token: session.idToken as string, ...me, rows };
}

test.describe('05.4 Invite codes and claiming your own record', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterAll(async () => {
    // Put the placeholder back, whatever state the run left it in. The claimed
    // row carries the claimer's name, so it is found by player rather than by
    // name.
    const me = await inviter();
    const claimerId = await claimerPlayerId();
    const claimed = me.rows.find((f: any) => String(f.friendPlayerId) === claimerId);
    if (claimed) await deleteFriend(me.token, String(claimed.id));
    const fresh = (await asUser(me.token, '/friends')).body?.data ?? [];
    if (!fresh.some((f: any) => f.name === KB05.CLAIM_FRIEND)) {
      await createFriend(me.token, KB05.CLAIM_FRIEND);
    }
  });

  test('the two invitation links, seen by the person who sends them', async ({ page }) => {
    test.setTimeout(240_000);
    const fx = await fixtures05();

    await blockPromos(page);
    await signInAs(page, fx.free.email, '/friendList');
    await quiet(page);
    await friendListReady(page);
    await hideSidebarIdentity(page, 'Marc KB');

    // 1. Your account's own code, from the Add Friend dialog.
    //
    // The link is the subject of the article, so it is NOT masked -
    // docs/style-guide.md: "If a share code is the subject, seed a fixed one and
    // show it." It cannot be seeded, but it is stable: the same account and the
    // same record answer with the same code every time.
    await openAddFriend(page);
    const global = await invitePanel(page);
    // toContainText, not exact getByText: the panel renders both sentences of
    // its explanation inside ONE element, split by a line break, so an exact
    // match on either half finds nothing.
    await expect(global.dialog).toContainText(KB05.INVITE_PANEL.lead);
    await expect(global.dialog).toContainText(KB05.INVITE_PANEL.note);
    await expect(global.dialog).toContainText(KB05.INVITE_PANEL.copy);
    await shot(page, ARTICLE, '01-invite-link-account', {
      clip: global.dialog, clipPad: PAD, annotate: global.field, annotatePad: 6,
    });
    await closeDialogs(page);

    // 2. One friend's own code, from that row's Edit dialog.
    //
    // Only a placeholder has one. A row that stands for a real account answers
    // 400 "Cannot generate share code for a friend who is already registered."
    const menu = await openFriendMenu(page, KB05.CLAIM_FRIEND);
    await menu.getByRole('menuitem', { name: KB05.ROW_MENU.edit }).click();
    await expect(topDialog(page).getByText(KB05.EDIT_DIALOG.title, { exact: true })).toBeVisible();
    const perFriend = await invitePanel(page);
    await shot(page, ARTICLE, '02-invite-link-friend', {
      clip: perFriend.dialog, clipPad: PAD, annotate: perFriend.field, annotatePad: 6,
    });
    await closeDialogs(page);
  });

  test('what the person who opens the link sees', async ({ page }) => {
    test.setTimeout(240_000);
    const me = await inviter();
    const placeholder = me.rows.find((f: any) => f.name === KB05.CLAIM_FRIEND);
    expect(placeholder, `${KB05.CLAIM_FRIEND} is missing. Run: node scripts/seed-05.mjs`)
      .toBeTruthy();
    const link = await friendShareLink(
      me.token, String(placeholder.id), String(me.playerId),
    );

    await blockPromos(page);
    // Sign in FIRST, then open the link. A signed-out visitor is bounced to
    // /signin and the code does not survive the redirect - the article says so.
    await signInAs(page, KB05.ACCOUNTS.claimer, '/friendList');
    await quiet(page);
    await hideSidebarIdentity(page, 'Nate KB');
    await page.goto(link);
    await quiet(page);

    // 3. The invitation. The inviter's name is the subject of the sentence, so
    //    it is not masked.
    const invite = onScreen(
      page.locator('[role="dialog"]').filter({ hasText: KB05.INVITATION_DIALOG.title }),
    ).first();
    await expect(invite).toBeVisible();
    await expect(invite).toContainText(KB05.INVITATION_DIALOG.lead);
    await expect(invite).toContainText('Marc KB');
    // Both sentences live in one element, split by a line break, so they are
    // matched with toContainText rather than as exact text nodes.
    await expect(invite).toContainText(KB05.INVITATION_DIALOG.ask);
    const accept = invite.getByRole('button', { name: KB05.INVITATION_DIALOG.accept, exact: true });
    await expect(invite.getByRole('button', { name: KB05.INVITATION_DIALOG.reject, exact: true }))
      .toBeVisible();
    await shot(page, ARTICLE, '03-friend-list-invitation', {
      clip: invite, clipPad: PAD, annotate: accept, annotatePad: 6,
    });

    // 4. Accepted. This is the one-way step, and afterAll is what puts the
    //    fixture back.
    await accept.click();
    const done = onScreen(
      page.locator('[role="dialog"]').filter({ hasText: KB05.INVITATION_DIALOG.done }),
    ).first();
    await expect(done).toBeVisible();
    // The dialog carries a Lottie animation that no capture setting settles.
    // See hideLottie() in lib/kb.ts.
    await hideLottie(page);
    await shot(page, ARTICLE, '04-invitation-accepted', { clip: done, clipPad: PAD });
    await closeDialogs(page);

    // Nothing lands on the claimer's own list. Worth asserting, because it is
    // the thing readers get wrong: this is not a two-way friendship.
    const theirs = (await asUser(
      (await mintSession(KB05.ACCOUNTS.claimer)).idToken, '/friends',
    )).body?.data ?? [];
    expect(theirs.some((f: any) => `${f.name} ${f.lastName ?? ''}`.trim() === 'Marc KB'))
      .toBeFalsy();
  });

  test('the row afterwards, on the list that sent the invitation', async ({ page }) => {
    test.setTimeout(240_000);
    const me = await inviter();
    const claimerId = await claimerPlayerId();
    const claimed = me.rows.find((f: any) => String(f.friendPlayerId) === String(claimerId));
    expect(claimed, 'the invitation was not accepted by the previous test').toBeTruthy();

    await blockPromos(page);
    await signInAs(page, me.email, '/friendList');
    await quiet(page);
    await friendListReady(page, 'Nate KB');
    await hideSidebarIdentity(page, 'Marc KB');

    // 5. The placeholder is gone and the person is in its place, under their own
    //    account name. Chat is live on it now, and Edit is not - the row belongs
    //    to them.
    const row = friendRow(page, 'Nate KB');
    await expect(row).toBeVisible();
    await expect(row.getByRole('button', { name: KB05.CHAT_BUTTON })).toBeEnabled();
    await expect(onScreen(page.getByText(KB05.CLAIM_FRIEND, { exact: true }))).toHaveCount(0);
    // No clipPad - see the note on 05.3's linked-row capture.
    await shot(page, ARTICLE, '05-claimed-row', { clip: row });
  });
});

/** The claimer's player id. Never hardcoded - the seed can rebuild the account. */
async function claimerPlayerId() {
  const session = await mintSession(KB05.ACCOUNTS.claimer);
  const me = (await asUser(session.idToken, '/users/me')).body?.data;
  if (!me) throw new Error(`${KB05.ACCOUNTS.claimer} has no Scoryboard user`);
  return String(me.playerId);
}
