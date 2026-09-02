// 18.3 - Replying, forwarding, reacting, editing and deleting.
//
// **Nothing in this spec is submitted.** Every one of these actions is
// irreversible against a seeded transcript - a reply is a new message, an edit
// overwrites, a delete cannot be undone and is not even confirmed - so each is
// photographed at its menu, its composer or its dialog, and the "after" states
// the article needs come from fixtures the seed already put in that state: a
// reply carrying a quote, a message carrying a reaction pill, an edited message
// and a deleted one.
//
// docs/style-guide.md, "Actions you can only do once": photograph the dialog, do
// not submit it; take the "after" from a second fixture.
//
// --- Two things about this page that shape the order below ----------------
//
// **A bubble whose menu has been opened keeps its chevron for good.** Not while
// hovered, and not while focused: parking the pointer at 0,0 does not clear it,
// and blurring the trigger does not either. Two runs went out with a chevron on
// the two bubbles that had been opened and none on the rest, which reads as a
// difference between messages rather than as something the spec did.
//
// So this spec captures OUT OF ORDER. The three at-rest captures - 03, 05 and
// 09 - are taken first, before any menu exists, and the six that need a menu
// follow. The filenames still carry the order the article shows them in.
//
// **Annotations inside the transcript go through a CLIPPED capture, always.**
// The transcript scrolls in its own container, so window.scrollY stays 0 and
// annotate() cannot turn a viewport box into a document box - an outline drawn
// on a full-page capture lands below its target. shot()'s clipped branch scrolls
// first and draws afterwards, which is the order that works. 18.1 shot 05 has
// the long version of this note.
//
// The action menus are portalled to the body, so they share no ancestor with the
// message they belong to. Each is captured by clipping to the MENU with a pad
// wide enough to bring the message back into frame.

import { test, expect } from '@playwright/test';
import {
  shot, context18, openConversation, openMessageMenu,
  bubble18, panelFor, transcriptColumn, transcriptSettled, fixtures18, messageId18,
  KB18, KB18_GROUP, KB18_REACTION, kb18Message,
} from '../../lib/kb';

test.describe('18.3 Replying, forwarding, reacting, editing and deleting', () => {
  test('every action, photographed before it is taken', async ({ browser }) => {
    await fixtures18();

    const theirs = kb18Message('reactTo').text;   // Milo's. The target of everything.
    const mine = kb18Message('opener').text;      // Pru's own. Edit and delete.
    const reply = kb18Message('replied').text;    // already quotes `theirs`
    const edited = kb18Message('edited').text;    // already carries the edited tag

    const pru = await context18(browser, KB18.pro);
    try {
      const page = pru.page;
      await openConversation(page, KB18_GROUP.title, theirs);

      // ================= at rest: no menu has been opened yet ===============

      // --- 03: a reply as it appears afterwards, from the seed ---------------
      const quote = page.getByText(theirs, { exact: true }).locator('visible=true').last();
      await shot(page, '18.3', '03-reply-in-transcript', {
        clip: bubble18(page, reply),
        clipPad: 16,
        annotate: quote,
        annotatePad: 2,
      });

      // --- 05: a message carrying a reaction, from the seed -------------------
      const pill = page.getByRole('button', { name: `Toggle ${KB18_REACTION.emoji} reaction` });
      await expect(pill).toBeVisible();
      await shot(page, '18.3', '05-reaction-pill', {
        clip: bubble18(page, theirs),
        clipPad: 24,
        annotate: pill,
      });

      // --- 09: edited, and deleted --------------------------------------------
      //
      // The whole conversation column, not a padded crop around one bubble. A
      // crop cannot hold both: your own messages are right-aligned and everybody
      // else's are left-aligned, so the deleted one and the edited one are at
      // opposite edges of an 800-pixel column. The first version of this capture
      // padded 110 pixels around the tombstone and published a frame with the
      // edited message nowhere in it.
      const tombstone = bubble18(page, 'This message was deleted');
      await expect(tombstone).toBeVisible();
      await expect(bubble18(page, edited)).toBeVisible();
      await expect(page.getByText(/·\s*edited/).last()).toBeVisible();
      // The two captures above scrolled the column up, which starts the
      // paginating fetch and puts a "Loading older messages..." pill at the top
      // - on a group that has none. It went out in one run.
      await transcriptSettled(page);
      await shot(page, '18.3', '09-edited-and-deleted', { clip: transcriptColumn(page) });

      // ================= everything that needs a menu =======================

      // The floating menu. Portalled to the body, so it is asked for by role.
      const menu = page.getByRole('menu');

      // --- 01: what you may do to somebody else's message --------------------
      await openMessageMenu(page, theirs);
      for (const item of ['Reply', 'Copy', 'React', 'Forward', 'Report', 'Delete for me']) {
        await expect(page.getByRole('menuitem', { name: item, exact: true })).toBeVisible();
      }
      // There is no Edit and no Delete for everyone on somebody else's message.
      // Asserted, because that absence is what the article's prose claims.
      await expect(page.getByRole('menuitem', { name: 'Edit', exact: true })).toHaveCount(0);
      await expect(page.getByRole('menuitem', { name: 'Delete for everyone', exact: true })).toHaveCount(0);
      await shot(page, '18.3', '01-menu-incoming', { clip: menu, clipPad: 90 });

      // --- 02: the reply composer ---------------------------------------------
      await page.getByRole('menuitem', { name: 'Reply', exact: true }).click();
      const replyStrip = page.getByText('Replying to Milo KB', { exact: true })
        .locator('xpath=ancestor::div[contains(@class,"rounded")][1]');
      await expect(replyStrip).toBeVisible({ timeout: 15_000 });
      await shot(page, '18.3', '02-reply-composer', {
        clip: replyStrip,
        clipPad: 60,
        annotate: replyStrip,
        // The outline would otherwise sit outside the clip and only its inner
        // edge would survive.
        annotatePad: -2,
      });
      // Put the composer back. Nothing is sent.
      //
      // The strip's only control is an unlabelled x at its right end - no
      // accessible name, and Escape does not dismiss it - so the button inside
      // the strip is the handle.
      await replyStrip.locator('button').last().click();
      await expect(replyStrip).toBeHidden({ timeout: 15_000 });

      // --- 04: the reaction picker ---------------------------------------------
      //
      // Opened and photographed, never chosen from. The seeded pill in shot 05
      // is what a chosen reaction looks like; clicking one here would toggle
      // that pill off and the next run would photograph a message with no
      // reaction on it.
      await openMessageMenu(page, theirs);
      await page.getByRole('menuitem', { name: 'React', exact: true }).click();
      const picker = page.getByRole('button', { name: 'Close', exact: true })
        .locator('xpath=ancestor::div[contains(@class,"rounded")][1]');
      await expect(picker).toBeVisible({ timeout: 15_000 });
      await shot(page, '18.3', '04-react-picker', { clip: picker, clipPad: 30 });
      await page.getByRole('button', { name: 'Close', exact: true }).click();
      await expect(picker).toBeHidden({ timeout: 15_000 });

      // --- 06: forwarding -------------------------------------------------------
      await openMessageMenu(page, theirs);
      await page.getByRole('menuitem', { name: 'Forward', exact: true }).click();
      const forward = panelFor(page, 'Forward Message');
      await expect(forward).toBeVisible({ timeout: 15_000 });
      // The list is your OTHER conversations. Pru has one direct chat, so there
      // is exactly one row, and Forward is disabled until it is ticked.
      await expect(page.getByRole('button', { name: 'Forward', exact: true })).toBeDisabled();
      await shot(page, '18.3', '06-forward-dialog', { clip: forward, clipPad: 8 });
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(forward).toBeHidden({ timeout: 15_000 });

      // --- 07: what you may do to your own message ------------------------------
      await openMessageMenu(page, mine);
      for (const item of ['Edit', 'Delete for me', 'Delete for everyone']) {
        await expect(page.getByRole('menuitem', { name: item, exact: true })).toBeVisible();
      }
      // Report is missing on your own message, which is the other half of the
      // difference between this menu and shot 01's.
      await expect(page.getByRole('menuitem', { name: 'Report', exact: true })).toHaveCount(0);
      await shot(page, '18.3', '07-menu-own', { clip: menu, clipPad: 90 });

      // --- 08: the edit composer -------------------------------------------------
      //
      // Edit replaces the bubble with a textarea, so bubble18() cannot find it by
      // its text any more - getByText does not match a textarea's value. The Save
      // button is the handle, and the bubble is its FIRST rounded ancestor: the
      // two wrappers in between, the button row and its spacer, carry no rounded
      // class at all.
      await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
      const save = page.getByRole('button', { name: 'Save', exact: true });
      await expect(save).toBeVisible({ timeout: 15_000 });
      const editing = save.locator('xpath=ancestor::div[contains(@class,"rounded")][1]');
      await shot(page, '18.3', '08-edit-composer', {
        clip: editing,
        clipPad: 16,
        annotate: save,
      });
      // Cancel, not Escape. Escape does not close this one - the first walk
      // through it left the textarea open and every later click missed.
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(save).toBeHidden({ timeout: 15_000 });
      await expect(bubble18(page, mine)).toBeVisible({ timeout: 15_000 });
    } finally {
      await pru.ctx.close();
    }

    // The transcript is exactly as the seed left it: nothing was sent, edited,
    // reacted to or deleted. messageId18 throws when the text is missing, so
    // this is the whole check.
    const fx = await fixtures18();
    for (const key of ['opener', 'reactTo', 'replied', 'edited']) {
      await messageId18(fx.sessions.pro.token, fx.groupId, kb18Message(key).text);
    }
  });
});
