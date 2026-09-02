// 18.1 - Chat overview: conversations, direct messages and groups.
//
// Six captures from two accounts, and the split is the point of the article.
//
// Pru is Pro and sees a working chat: a conversation list, a direct chat, a
// group. Marc is Free and sees the same group as a column of ten-character
// stubs with an "Unlock with Pro" button under each one. Both are true, and a
// reader on Free needs to recognise the second before they think chat is broken.
//
// Two accounts, never one flipped (docs/style-guide.md, "Actions you can only do
// once"), and never two contexts at once - presence is live and a second
// signed-in context turns an avatar's dot green. context18() and the
// close-before-open order below are what enforce that.

import { test, expect } from '@playwright/test';
import {
  shot, context18, openConversation, conversationHeader, conversationRow,
  panelFor, sidebarIdentity18, fixtures18,
  KB18, KB18_GROUP, KB18_DIRECT_PRO, kb18Message, lockedPreview,
} from '../../lib/kb';

test.describe('18.1 Chat overview', () => {
  test('the list, a direct chat, a group, and what Free sees instead', async ({ browser }) => {
    // Proves the seed has run and the group exists before anything is captured.
    await fixtures18();

    const groupOpener = kb18Message('opener').text;
    const groupTarget = kb18Message('reactTo').text;
    const directFirst = KB18_DIRECT_PRO[0].text;

    // --- Pro: the chat page as it is meant to look -------------------------
    const pru = await context18(browser, KB18.pro);
    try {
      const page = pru.page;
      await openConversation(page, KB18_GROUP.title, groupOpener);

      // No annotation. The subject is the whole three-column page, and an
      // outline around a full-height column is two red lines running off the top
      // and bottom edges - which points at nothing. The prose names the columns.
      await shot(page, '18.1', '01-chat-page', {
        mask: [sidebarIdentity18(page, 'Pru KB')],
      });

      // One row, close up, rather than the whole Chats column. The column is
      // 899 pixels tall with two rows in it, so clipping to it publishes a strip
      // that is nine tenths white - which is what the first run of this capture
      // produced. The row carries everything the article names: avatar, title,
      // the Group tag, the last message and its time.
      await shot(page, '18.1', '02-conversation-list', {
        clip: conversationRow(page, KB18_GROUP.title),
        clipPad: 8,
        // The Group tag is the only thing on a row that says which kind it is.
        annotate: page.getByText('Group', { exact: true }).locator('visible=true').first(),
        annotatePad: 3,
      });

      // The direct conversation. Its row is titled with the other person's name.
      await openConversation(page, 'Milo KB', directFirst);
      await expect(conversationHeader(page, 'Milo KB')).toBeVisible();
      await shot(page, '18.1', '03-direct-conversation', {
        mask: [sidebarIdentity18(page, 'Pru KB')],
        // The header block, not the words alone: the subtitle is a full-width
        // <p>, so an outline on it runs the whole width of the column and points
        // at nothing.
        annotate: conversationHeader(page, 'Milo KB'),
      });

      await openConversation(page, KB18_GROUP.title, groupOpener);
      // The four system lines are what a group opens with, and they only exist
      // on a group. Gate on one so the capture cannot be taken before they land.
      await expect(page.getByText('Pru KB created the group')).toBeVisible({ timeout: 30_000 });
      await shot(page, '18.1', '04-group-conversation', {
        mask: [sidebarIdentity18(page, 'Pru KB')],
        annotate: conversationHeader(page, KB18_GROUP.title),
      });
    } finally {
      await pru.ctx.close();
    }

    // --- Free: the same group, locked --------------------------------------
    //
    // Closed above before this opens. Not tidiness: two live contexts change the
    // presence dots, and the dots are in both captures.
    const marc = await context18(browser, KB18.free);
    try {
      const page = marc.page;
      // Marc cannot see the full text of anything Pru or Milo sent, so the
      // transcript is gated on HIS OWN message, which arrives whole.
      await openConversation(page, KB18_GROUP.title, kb18Message('marcs').text);

      // The measured shape of the gate, asserted rather than assumed: ten
      // characters and an ellipsis. If the truncation length ever changes, this
      // fails here instead of publishing a screenshot of something else.
      const stub = lockedPreview(groupTarget);
      await expect(page.getByText(stub, { exact: true }).locator('visible=true').first())
        .toBeVisible({ timeout: 30_000 });
      const unlock = page.getByRole('button', { name: 'Unlock with Pro' }).first();
      await expect(unlock).toBeVisible();

      // No annotation, for two reasons.
      //
      // The subject is the pattern - EVERY incoming message is a stub with an
      // Unlock with Pro button under it - and an outline around one of six
      // identical controls says the opposite.
      //
      // The mechanical reason matters more for anything written after this. The
      // transcript scrolls in its own container, so window.scrollY stays 0 and
      // annotate() cannot convert a viewport box into a document box. An outline
      // on a bubble therefore lands somewhere below the bubble; the first run of
      // this capture put one around an empty patch of background. **Inside the
      // transcript, annotate only through a CLIPPED capture** - shot()'s clipped
      // branch scrolls first and draws afterwards, which is the order that
      // works. 18.3 does it that way throughout.
      await shot(page, '18.1', '05-free-locked-transcript', {
        mask: [sidebarIdentity18(page, 'Marc KB')],
      });

      await unlock.click();
      const modal = panelFor(page, 'Unlock full chat with Pro');
      await expect(modal).toBeVisible({ timeout: 20_000 });
      await expect(page.getByRole('button', { name: /FREE Upgrade/ })).toBeVisible();

      // No mask: the modal IS the subject, and nothing in it is dynamic.
      await shot(page, '18.1', '06-free-gate-modal', { clip: modal, clipPad: 8 });

      // Left as it was found. Nothing was upgraded: this account must stay Free
      // or 05 and 06 cannot be taken again.
      await page.getByRole('button', { name: 'Close' }).last().click();
      await expect(modal).toBeHidden();
    } finally {
      await marc.ctx.close();
    }

    // The Free account is still Free.
    //
    // Shot 06 is one click away from FREE Upgrade (Beta), which upgrades the
    // account in place with no confirmation. If that click ever lands, 05 and 06
    // stop existing on this account and cannot be put back without re-seeding.
    // fixtures18() refuses when any persona's membership has drifted, so calling
    // it again here is the cheapest possible guard.
    const after = await fixtures18();
    expect(after.sessions.free.membership).toBe('Free');
    expect(after.sessions.pro.membership).toBe('Pro');
  });
});
