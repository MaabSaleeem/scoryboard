// 19.1 - Commenting on a team or a leaderboard.
//
// The article was mapped as "Commenting on a match, team, player, league or
// tournament". Three of those five have no comment box: a match page fires no
// `/comments` request at all, a player profile fires none, and no tournament tab
// fires one either. briefs/19.md, "Read this first", has the measurements. This
// spec therefore photographs the two screens that do have one - a team and a
// leaderboard - and the state a non-member sees.
//
// --- Nothing here is posted ------------------------------------------------
//
// **A comment cannot be deleted.** `DELETE /comments/:commentId` answers
// `401 "Unauthorized to delete this comment"` even to its author, and no control
// in the app calls it. So a spec that submitted a comment would add a row to the
// thread on every run, for ever: the panel heading counts comments, every gate
// in this collection waits on that count, and the fourth run would fail its own
// second shot.
//
// docs/style-guide.md, "Actions you can only do once": photograph the composer,
// do not submit it; take the "after" from a fixture that is already in that
// state. Shots 02 and 03 fill the box and clear it again. Shot 04's posted
// comment with its image comes from scripts/seed-19.mjs.
//
// --- Two things about this panel that shape the order below ----------------
//
// **The panel keeps loading after it has counted.** It fetches what sits behind
// "View n more replies" separately, so the heading can be right while a spinner
// is still under a thread. commentsPanel() gates on both - it is collection 08's
// helper and settled08() is the half that matters here.
//
// **An attachment is not an `<img>`.** `GET /comments/:id/media/:filename` needs
// the bearer token, so the app fetches it, makes a `blob:` URL and paints it as
// a CSS background on a bare div. imagesPainted() probes background images, so
// the ordinary gate holds, but the locator has to go through the style
// attribute - see commentAttachment().

import { test, expect } from '@playwright/test';
import {
  shot, context19, fixtures19, comments19, commentsSection, commentRow,
  commentAttachment, commentBox, commentTimes, kb19Comment, settled08, asUser, KB19,
} from '../../lib/kb';

const TEAM_COMMENTS = 3;
const BOARD_COMMENTS = 2;

test.describe('19.1 Commenting on a team or a leaderboard', () => {
  test('the composer, an attachment, both screens, and the members-only gate', async ({ browser }) => {
    const fx = await fixtures19();

    // ================= as Pia, a member of both ==========================
    const pia = await context19(browser, KB19.player, `/teams/${fx.teamId}`);
    try {
      const page = pia.page;
      await comments19(page, TEAM_COMMENTS);
      const panel = commentsSection(page, TEAM_COMMENTS);
      const box = commentBox(page);

      // --- 01: the panel at rest ------------------------------------------
      await expect(page.getByRole('button', { name: 'Add Media' })).toBeEnabled();
      await expect(page.getByRole('button', { name: 'Comment', exact: true })).toBeVisible();
      await shot(page, '19.1', '01-team-comments-panel', {
        clip: panel,
        mask: [commentTimes(page)],
        annotate: box,
      });

      // --- 02: a comment typed, not sent ------------------------------------
      //
      // fill(), not type(): the composer is a react-mentions textarea and typing
      // character by character fires its `@` trigger scan on every keystroke for
      // no benefit. The Comment button is disabled while the box is empty, so
      // waiting for it to be enabled proves the value landed.
      await box.fill('Can somebody bring the corner flags on Tuesday?');
      const post = page.getByRole('button', { name: 'Comment', exact: true });
      await expect(post).toBeEnabled();
      await shot(page, '19.1', '02-composer-typed', {
        clip: box.locator('xpath=ancestor::div[.//button][1]'),
        clipPad: 16,
        annotate: post,
      });

      // --- 03: an image chosen, still not sent -------------------------------
      //
      // The file input is hidden and `accept="image/*"`, so the chooser cannot
      // be driven by a click. setInputFiles goes straight at the input, which is
      // what a spec should do anyway - a native file dialog is not capturable.
      //
      // The composer's own preview is an `<img alt="preview-0">` carrying a
      // blob: src. A POSTED attachment is not - that one is a CSS background on
      // a bare div - so the two are found different ways and a locator written
      // for one finds the other's neighbour. The first version of this line
      // matched `div[style*="background-image"]` across the whole panel and
      // resolved to the seeded comment's image instead of the draft's.
      const composer = box.locator('xpath=ancestor::div[.//button][1]');
      await page.locator('input[type="file"]').first()
        .setInputFiles('assets/19/kb-comets-kit.png');
      const preview = composer.locator('img[alt^="preview-"]').first();
      await expect(preview).toBeVisible({ timeout: 20_000 });

      // Wait for the UPLOAD, not for the thumbnail. The preview appears the
      // instant the file is chosen, from a local blob, and the app then POSTs it
      // to /comments/media - painting a spinner over the thumbnail and disabling
      // Add Media and Comment while it does. The first run published exactly
      // that: a faded shirt under a spinner, with both buttons greyed out.
      // docs/style-guide.md forbids a spinner in a capture. settled08() catches
      // it (shot()'s own backstop only looks for .animate-pulse), and the two
      // buttons coming back is what says the token has landed.
      await settled08(page);
      await expect(page.getByRole('button', { name: 'Add Media' })).toBeEnabled();
      await expect(post).toBeEnabled();
      await shot(page, '19.1', '03-composer-with-image', {
        clip: composer,
        clipPad: 16,
        annotate: preview,
      });

      // Put the composer back by reloading, not by clearing the box. Emptying
      // the textarea leaves the chosen file attached - text and attachments are
      // separate state - and the only control that drops one is an unlabelled
      // div over the corner of the thumbnail. A reload is certain, and nothing
      // was sent, so there is nothing to undo.
      await page.reload();
      await comments19(page, TEAM_COMMENTS);
      await expect(commentBox(page)).toHaveValue('');

      // --- 04: a posted comment carrying its image, from the seed -------------
      const withMedia = commentRow(page, kb19Comment('New kit arrived').text);
      const image = commentAttachment(withMedia);
      await expect(image).toBeVisible();
      await shot(page, '19.1', '04-comment-with-attachment', {
        clip: withMedia,
        clipPad: 12,
        mask: [commentTimes(page)],
        annotate: image,
      });

      // --- 05: the same panel on a leaderboard --------------------------------
      //
      // Navigated rather than reached through the COMMENTS tab. The tab is not a
      // route - it scrolls to a panel that sits below every other tab - so the
      // bare path shows the same thing with one less click to go wrong.
      await page.goto(`/leaderboards/${fx.leaderboardId}`);
      await comments19(page, BOARD_COMMENTS);
      await shot(page, '19.1', '05-leaderboard-comments-panel', {
        clip: commentsSection(page, BOARD_COMMENTS),
        mask: [commentTimes(page)],
      });
    } finally {
      await pia.ctx.close();
    }

    // ================= as Otto, who is on neither ========================
    //
    // A separate context, not a second sign-in on the same page: the app
    // persists a Redux store per origin and the leftover would decide what the
    // team page renders. See context19().
    const otto = await context19(browser, KB19.outsider, `/teams/${fx.teamId}`);
    try {
      const page = otto.page;
      await comments19(page, TEAM_COMMENTS);

      // The panel is not hidden from a non-member. Every control in it is
      // disabled, with no message saying why - which is the whole point of the
      // capture, and is asserted rather than assumed.
      const box = commentBox(page);
      await expect(box).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Comment', exact: true })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Add Media' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Reply', exact: true }).first()).toBeDisabled();
      // The header says External Team, which is how a reader knows this is the
      // screen the article is describing.
      await expect(page.getByText('External Team', { exact: true }).first()).toBeVisible();

      await shot(page, '19.1', '06-composer-disabled', {
        clip: commentsSection(page, TEAM_COMMENTS),
        mask: [commentTimes(page)],
        annotate: box.locator('xpath=ancestor::div[.//button][1]'),
      });
    } finally {
      await otto.ctx.close();
    }

    // The threads are exactly as the seed left them: nothing was posted from
    // either account. The counts are read back off the API rather than off the
    // page, so a comment that failed to render would still be caught.
    for (const [entityId, commentType, want] of [
      [fx.teamId, 'team', TEAM_COMMENTS],
      [fx.leaderboardId, 'leaderboard', BOARD_COMMENTS],
    ] as const) {
      const r = await asUser(fx.sessions.owner.token,
        `/comments?entityId=${entityId}&commentType=${commentType}&limit=50&skip=0`);
      expect(r.body?.data?.total, `${commentType} thread grew`).toBe(want);
    }
  });
});
