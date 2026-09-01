// 15.7 - The tournament chat room.
//
// The map flags this `free_pro` and `role`. What the exploration found:
//
// - **The free_pro flag does not bite.** config/api.md's limits table blocks
//   "Reading incoming chat in full" on Free, and the tournament chat is not where
//   that happens: Fred KB (Free, never flipped) reads a long incoming message in
//   full, in a tournament group chat, with a "Read more" control that expands it
//   in place. The Pro account gets exactly the same control. No
//   CHAT_PRO_REQUIRED modal appears. So there is no dual capture, and the article
//   does not claim a Free limit that is not there.
// - **The role difference is real, and it is not the one the setting describes.**
//   Anybody signed in can open the public Chat tab, and doing so JOINS them to
//   the group and gives them a composer - a complete outsider included. Turning
//   on "Announcement only" locks it, with "Only group admins can send messages in
//   this announcement-only chat." and a disabled attachment control. It locks
//   out a **tournament admin** too: Ada KB is an admin on KB 15 League and still
//   cannot post, even though the setting's own help text says "only tournament
//   owner and admins can send messages".
//
// Fixtures: KB 15 Cup, open chat, two seeded messages. KB 15 League, the same
// chat with Announcement only ON.
//
// Chat has no REST surface - it is Firestore, like the match feed in 10.10 - so
// the two messages cannot be seeded over the API. `ensureChatMessage` types them
// only when they are not already there, which is what stops the transcript
// growing a copy on every run.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures15, freezeClock15, onScreen, centre,
  chatReady, chatTimes, ensureChatMessage, publicContext, openPublicPage,
  publicTab, signInThenPublic, KB15,
} from '../../lib/kb';

const WELCOME = 'Welcome to KB 15 Cup. Kick-off is 10:00 at KB 15 Astro Park.';
const LONG = 'Reminder for every team in KB 15 Cup: please arrive at KB 15 Astro Park '
  + 'thirty minutes before your first fixture, bring both a light and a dark kit, and '
  + 'check the Schedule tab for your pitch number because Group B kicks off an hour '
  + 'after Group A and the bracket follows straight after that.';

test.describe('15.7 The tournament chat room', () => {
  test('the room, the composer, a long message, and announcement only',
    async ({ page, browser }) => {
      const fx = await fixtures15();
      const identity = page.getByText('Oona KB', { exact: true });

      // --- the owner's own room ------------------------------------------------
      await signInAs(page, fx.email, `/tournaments/${fx.cup}/chat`);
      await freezeClock15(page);
      await quiet(page);
      await chatReady(page);
      await ensureChatMessage(page, WELCOME);
      await ensureChatMessage(page, LONG);

      // Every timestamp is masked: they are the wall clock at the moment the
      // message was typed, and the seed cannot fix them.
      await shot(page, '15.7', '01-chat-tab', {
        mask: [identity, chatTimes(page)],
      });

      const composer = page.getByPlaceholder('Write a message...');
      const composerRow = composer.locator('xpath=ancestor::div[.//input[@type="file"]][1]');
      await centre(composerRow);
      await shot(page, '15.7', '02-composer', {
        clip: composerRow, clipPad: 12, annotate: composer,
      });

      // --- the free_pro pair, which is the point: they are the same ------------
      // A message past about 200 characters is cut short with Read more. The
      // owner here is Pro, and gets it. Fred is Free and has never been flipped,
      // and gets exactly the same control, which expands the message in place -
      // no CHAT_PRO_REQUIRED modal, no upgrade prompt. Two captures, one on each
      // plan, because that is what the flag asks for and the answer is "no
      // difference".
      const proReadMore = page.getByRole('button', { name: /Read more/i }).first();
      await expect(proReadMore).toBeVisible({ timeout: 30_000 });
      await centre(proReadMore);
      await shot(page, '15.7', '03-read-more-pro', {
        mask: [identity, chatTimes(page)],
        annotate: proReadMore,
      });

      const freeCtx = await publicContext(browser);
      const free = await freeCtx.newPage();
      try {
        await signInThenPublic(free, KB15.free, `/tournament/${fx.cup}/chat`);
        await freezeClock15(free);
        await quiet(free);
        await chatReady(free);
        const readMore = free.getByRole('button', { name: /Read more/i }).first();
        await expect(readMore).toBeVisible({ timeout: 30_000 });
        await readMore.click();
        await expect(free.getByText(LONG.slice(-40))).toBeVisible({ timeout: 30_000 });
        // No modal, no upgrade prompt. Asserted, because the article says so.
        await expect(free.getByText('Unlock full chat with Pro')).toHaveCount(0);
        await shot(free, '15.7', '04-read-more-free-expanded', {
          mask: [free.getByText('Fred KB', { exact: true }), chatTimes(free)],
        });
      } finally {
        await freeCtx.close();
      }

      // --- the setting that locks the room -------------------------------------
      await page.goto(`/tournaments/${fx.cup}/settings`);
      const announcement = onScreen(page.getByText('Announcement only', { exact: true })).first();
      await expect(announcement).toBeVisible({ timeout: 30_000 });
      await quiet(page);
      const chatCard = announcement.locator('xpath=ancestor::div[.//button[@role="checkbox"]][1]');
      await centre(chatCard);
      // Photographed, not switched. KB 15 Cup's chat stays open, and the locked
      // state comes from KB 15 League, which the seed leaves announcement-only -
      // docs/style-guide.md, "take the after state from a second fixture".
      await shot(page, '15.7', '05-announcement-only-setting', {
        clip: chatCard, clipPad: 12,
        annotate: chatCard.locator('button[role="checkbox"]'),
        annotatePad: 8,
      });

      const lockedCtx = await publicContext(browser);
      const locked = await lockedCtx.newPage();
      try {
        // Ada is a tournament ADMIN on KB 15 League and is still refused.
        await signInThenPublic(locked, KB15.admin, `/tournament/${fx.league}/chat`);
        await freezeClock15(locked);
        await quiet(locked);
        await chatReady(locked);
        await expect(locked.getByText(
          'Only group admins can send messages in this announcement-only chat.',
        )).toBeVisible({ timeout: 30_000 });
        await expect(locked.locator('input[type="file"]').first()).toBeDisabled();
        await shot(locked, '15.7', '06-announcement-only-locked', {
          mask: [locked.getByText('Ada KB', { exact: true }), chatTimes(locked)],
        });
      } finally {
        await lockedCtx.close();
      }

      // --- and a visitor with no account ---------------------------------------
      const outCtx = await publicContext(browser);
      const out = await outCtx.newPage();
      try {
        await openPublicPage(out, fx.cup, 'info');
        await publicTab(out, 'Chat').click();
        await expect(out.getByText('Join Tournament Chat', { exact: true }))
          .toBeVisible({ timeout: 30_000 });
        await expect(out.getByText(
          'Please sign in or create an account to join this tournament chat.',
        )).toBeVisible();
        await shot(out, '15.7', '07-signed-out-chat');
      } finally {
        await outCtx.close();
      }
    });
});
