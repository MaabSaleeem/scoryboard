// 19.2 - Replying to and liking comments.
//
// The article was mapped as "Editing, deleting and liking comments". Neither
// editing nor deleting exists on this build: a comment row carries exactly three
// controls - Reply, a thumbs-up and a reply-count bubble - the bundle holds no
// `editComment` and no `deleteComment`, and `DELETE /comments/:commentId`
// answers `401 "Unauthorized to delete this comment"` to the author. briefs/19.md,
// "Read this first", has the measurements. So this spec photographs the two
// things the row does offer, and the article says plainly that a comment is
// permanent.
//
// --- What is submitted and what is not -------------------------------------
//
// **The reply is not sent.** A reply is a comment and a comment cannot be
// deleted, so sending one would grow the thread on every run and every gate in
// this collection waits on the comment count. The composer is opened, framed and
// cancelled; shot 02's reply comes from scripts/seed-19.mjs.
//
// **The like IS sent, and taken back.** It is the one action here that undoes
// cleanly - `POST /comments/:id/like` then `DELETE` - and the "after" state is
// the whole point of shot 04. docs/style-guide.md: "A spec that consumes or
// mutates a fixture puts it back itself." The unlike is in a `finally`, so it
// happens even when a capture throws.
//
// --- Two things about these controls ---------------------------------------
//
// **Neither icon button has an accessible name.** Their only text is the count,
// which moves the moment a like lands, so they are found by their icon. The
// thumbs-up changes SHAPE as well as colour between states, which is why
// likeButton() matches two SVG paths - see lib/kb.ts.
//
// **The like count is the total, not yours.** All four shots are of ONE comment,
// Ollie's "Training moves to the astro from Tuesday." - the same one the reply
// shots use, so the article never changes subject. Pat has liked it and Pia has
// not, so it reads 1 with a grey thumbs-up, and Pia's like takes it to 2 and
// turns it blue. A comment nobody had liked would show 0 and prove less.

import { test, expect } from '@playwright/test';
import {
  shot, context19, fixtures19, comments19, commentRow, commentTimes,
  likeButton, likedState, replyCountButton, replyComposer, kb19Comment,
  asUser, parkPointer, KB19,
} from '../../lib/kb';

const TEAM_COMMENTS = 3;

test.describe('19.2 Replying to and liking comments', () => {
  test('the reply composer, a reply in its thread, and a like taken and returned', async ({ browser }) => {
    const fx = await fixtures19();

    const parent = kb19Comment('Training moves to the astro').text;
    const reply = kb19Comment('Training moves to the astro').replies[0].text;
    const likeTarget = parent;

    const pia = await context19(browser, KB19.player, `/teams/${fx.teamId}`);
    let liked = false;
    try {
      const page = pia.page;
      await comments19(page, TEAM_COMMENTS);
      const row = commentRow(page, parent);

      // --- 01: the reply composer, opened and not sent -----------------------
      //
      // It is a SECOND textarea with the SAME placeholder as the panel's own
      // composer, so the placeholder cannot find it. Its Cancel button can - the
      // top-level composer has none.
      await row.getByRole('button', { name: 'Reply', exact: true }).click();
      const composer = replyComposer(page);
      await expect(composer).toBeVisible({ timeout: 15_000 });
      await composer.getByRole('textbox').fill('I can bring them if nobody else has.');
      // Clipped to the THREAD, not to the composer. A crop that hugs the reply
      // box is a correct picture of nothing: the first run published a floating
      // text box with Cancel and Reply and no way to tell which comment it
      // belonged to. The thread wrapper holds the parent comment and everything
      // indented under it.
      await shot(page, '19.2', '01-reply-composer', {
        clip: row.locator('xpath=..'),
        clipPad: 12,
        mask: [commentTimes(page)],
        annotate: composer,
      });

      // Cancel, never Reply. Escape does not close this composer.
      await composer.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(composer).toBeHidden({ timeout: 15_000 });

      // --- 02: the seeded reply, under its parent ----------------------------
      //
      // Replies are collapsed behind "View n more replies" and fetched on
      // demand. The panel finishes counting before that fetch lands, so the
      // reply's own text is the gate - not the click.
      await page.getByText('View 1 more replies', { exact: true }).click();
      const replyRow = commentRow(page, reply);
      await expect(replyRow).toBeVisible({ timeout: 20_000 });
      await comments19(page, TEAM_COMMENTS);
      await shot(page, '19.2', '02-reply-in-thread', {
        clip: row.locator('xpath=..'),
        clipPad: 12,
        mask: [commentTimes(page)],
        annotate: replyRow,
      });

      // --- 03: a comment nobody signed in has liked ---------------------------
      //
      // parkPointer() before both like captures. The controls sit in a hover
      // group and the pointer is left wherever the last click put it, which on
      // the first walk through left a hover colour on the icon in shot 03 and
      // not in shot 04 - a difference the article would have to explain.
      const target = commentRow(page, likeTarget);
      const thumb = likeButton(target);
      await expect(thumb).toHaveText('1');
      expect(await likedState(target)).toBe('not-liked');
      await parkPointer(page);
      await shot(page, '19.2', '03-comment-not-liked', {
        clip: target,
        clipPad: 12,
        mask: [commentTimes(page)],
        annotate: thumb,
      });

      // --- 04: the same comment, liked ----------------------------------------
      await thumb.click();
      liked = true;
      await expect(thumb).toHaveText('2', { timeout: 20_000 });
      expect(await likedState(target)).toBe('liked');
      await parkPointer(page);
      await shot(page, '19.2', '04-comment-liked', {
        clip: target,
        clipPad: 12,
        mask: [commentTimes(page)],
        annotate: thumb,
      });

      // The reply count is untouched by any of this, which is the assertion that
      // says the reply composer really was cancelled rather than sent. One, from
      // the seed, and not two.
      await expect(replyCountButton(target)).toHaveText('1');
    } finally {
      // Take the like back over the API rather than through the page: the page
      // may be closed or mid-navigation when a capture throws, and this has to
      // run either way. DELETE on a like that is not there answers 4xx and is
      // ignored - the assertion below is what proves the state.
      if (liked) {
        const r = await asUser(fx.sessions.owner.token,
          `/comments?entityId=${fx.teamId}&commentType=team&limit=50&skip=0`);
        const row = (r.body?.data?.comments ?? [])
          .find((c: any) => c.comment === parent);
        if (row) {
          await asUser(fx.sessions.player.token, `/comments/${row.id}/like`, { method: 'DELETE' });
        }
      }
      await pia.ctx.close();
    }

    // The thread is exactly as the seed left it: no comment was added, and the
    // like Pia took is back off. Read off the API, not off a page.
    const after = await asUser(fx.sessions.owner.token,
      `/comments?entityId=${fx.teamId}&commentType=team&limit=50&skip=0`);
    expect(after.body?.data?.total, 'the team thread grew').toBe(TEAM_COMMENTS);
    const restored = (after.body?.data?.comments ?? [])
      .find((c: any) => c.comment === parent);
    expect(restored?.likeCount, 'the like was not taken back').toBe(1);
  });
});
