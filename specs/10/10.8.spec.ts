// 10.8 - The match feed and commentary.
//
// The feed is the match's diary, and it writes itself: every goal, revoke, card
// and Player of the Match choice lands on it with the score at that moment beside
// it, plus a `SystemEvent` when the app does something on its own. Eight kinds of
// entry in all - GoalAwarded, GoalRevoked, YellowCard, RedCard, PlayerOfMatch,
// Comment, SystemEvent and PastMatch.
//
// What a reader adds by hand is a **Comment**: up to 300 characters with a live
// counter, and optionally a photo or a video.
//
// Flagged `free_pro`, and the split is the attachment. **Add media** opens the
// file chooser on Pro and the **Add Media** gate on Free - "You need a Pro
// membership to add videos and images to your match feed." The gate reads the
// signed-in user's membership, so Ada, a Free Administrator, hits it on Mo's Pro
// team.
//
// Two things this spec is careful about.
//
// **Shot 08 does not press Add media.** On Pro it opens the operating system's
// file chooser, which cannot be photographed and would hang the spec. The Pro
// half of the dual capture is therefore the same window with the control
// outlined and no gate over it - which is the whole difference.
//
// **The action bar is only on a Live match.** A Finished match has no Comment
// button: the feed becomes a record. So shots 01 and 02 come from the played
// fixture and 03 to 08 from a Live throwaway.

import { test, expect } from '@playwright/test';
import {
  shot, signInAs, onScreen, parkPointer, centre,
  fixtures10, openMatch10, afterKickOff, settled10,
  matchPanel, matchDialog10, closeDialog10, openFeedDialog, feedAction, gate10,
  sidebarIdentity10, moving10,
  KB10, KB10_TIMER_MINUTES, KB10_PLAYED_COMMENTARY,
} from '../../lib/kb';

/** Fixed text, fixed length. No clock, no random data. */
const LINE = 'Great save from Eve KB, right on the line.';

test.describe('10.8 The match feed and commentary', () => {
  test('what the feed records', async ({ page }) => {
    const fx = await fixtures10();
    await signInAs(page, KB10.pro, '/');
    await openMatch10(page, fx.played, fx.frozenNow);

    const mask = [sidebarIdentity10(page, 'Mo KB'), ...moving10(page)];
    const feed = matchPanel(page, 'feed');

    // The played fixture's feed carries one of nearly every kind of entry, which
    // is what makes it worth photographing rather than a throwaway.
    await expect(onScreen(feed.getByText(/awarded goal to/)).first()).toBeVisible({ timeout: 30_000 });
    await expect(onScreen(feed.getByText(/issued Yellow Card to/)).first()).toBeVisible();
    await expect(onScreen(feed.getByText(/issued Red Card to/)).first()).toBeVisible();
    await expect(onScreen(feed.getByText('Player of the match', { exact: true })).first()).toBeVisible();
    await expect(onScreen(feed.getByText(KB10_PLAYED_COMMENTARY[0].description)).first()).toBeVisible();
    // And no action bar, because the match is over.
    await expect(feedAction(page, 'Comment')).toHaveCount(0);
    await settled10(page);

    // 01 - the whole panel: the note at the top, then the diary.
    await parkPointer(page);
    await shot(page, '10.8', '01-feed-panel', { clip: feed, mask });

    // 02 - the entries close up, with the running score beside each one. A
    // viewport capture centred on a goal rather than a clip: the entries have no
    // container of their own that excludes the note and the action bar.
    const goal = onScreen(feed.getByText(/awarded goal to/)).first();
    await centre(goal);
    await settled10(page);
    await parkPointer(page);
    await shot(page, '10.8', '02-feed-entries', { annotate: goal, mask });
  });

  test('adding a line of commentary', async ({ page }) => {
    const fx = await fixtures10();
    const t = await fx.throwaway('live');
    try {
      await signInAs(page, KB10.pro, '/');
      await openMatch10(page, t.id, afterKickOff(t.match, KB10_TIMER_MINUTES));

      const mask = [sidebarIdentity10(page, 'Mo KB'), ...moving10(page)];
      const feed = matchPanel(page, 'feed');
      const comment = feedAction(page, 'Comment');

      // 03 - the button, fourth in the action bar.
      await comment.scrollIntoViewIfNeeded();
      const bar = comment.locator('xpath=..');
      await expect(bar).toBeVisible();
      await parkPointer(page);
      await shot(page, '10.8', '03-comment-button', {
        clip: bar, clipPad: 20, annotate: comment, mask,
      });

      // 04 - the window, empty. The counter starts at 0/300.
      const win = await openFeedDialog(page, 'Comment', 'Add comment');
      const box = win.locator('textarea');
      await expect(box).toBeVisible();
      await expect(win.getByText('0/300', { exact: true })).toBeVisible();
      await parkPointer(page);
      await shot(page, '10.8', '04-comment-window', { clip: win, clipPad: 20, mask });

      // 05 - typed. The counter moves, which is the only feedback on the limit.
      await box.fill(LINE);
      await expect(win.getByText(`${LINE.length}/300`, { exact: true })).toBeVisible();
      await parkPointer(page);
      await shot(page, '10.8', '05-comment-typed', { clip: win, clipPad: 20, mask });

      // 08 - the Pro half of the dual capture, taken here because it is the same
      // window. Add media is outlined and NOT pressed: on Pro it opens the file
      // chooser, which is the operating system's and cannot be photographed.
      // getByText, not getByRole('button'). The control reads "Add media" and
      // looks like a button, and it is not one - a role query finds nothing and
      // waits out its whole timeout. It is the label that fronts the window's
      // hidden file input.
      const media = onScreen(win.getByText(/add media/i)).first();
      await expect(media).toBeVisible();
      await parkPointer(page);
      await shot(page, '10.8', '08-add-media-pro', {
        clip: win, clipPad: 20, annotate: media, mask,
      });
      // Proof there is no gate on Pro: the window is still the only one open.
      await expect(page.locator('[role="dialog"]')).toHaveCount(1);

      // 06 - posted. The line joins the feed like any other entry.
      await win.getByRole('button', { name: 'Post' }).click();
      await expect(matchDialog10(page, 'Add comment')).toHaveCount(0, { timeout: 30_000 });
      const posted = onScreen(feed.getByText(LINE)).first();
      await expect(posted).toBeVisible({ timeout: 30_000 });
      await settled10(page);
      await parkPointer(page);
      await shot(page, '10.8', '06-comment-on-feed', {
        clip: feed, annotate: posted, mask,
      });
    } finally {
      expect(await fx.cancel(t.id), 'the throwaway must be cancelled').toBe(200);
    }
  });

  test('attaching a photo on Free', async ({ page }) => {
    const fx = await fixtures10();
    const t = await fx.throwaway('live');
    try {
      await signInAs(page, KB10.admin, '/');
      await openMatch10(page, t.id, afterKickOff(t.match, KB10_TIMER_MINUTES));

      const mask = [sidebarIdentity10(page, 'Ada KB'), ...moving10(page)];

      // Ada is Free. The comment box itself is not gated - commenting is open to
      // anybody signed in - so the window opens and the text can be typed. Only
      // the attachment is Pro.
      const win = await openFeedDialog(page, 'Comment', 'Add comment');
      await expect(win.locator('textarea')).toBeVisible();

      // 07 - the Free half. Add media opens the gate instead of the file chooser.
      // getByText: see the note in the test above.
      await onScreen(win.getByText(/add media/i)).first().click();
      const dlg = await gate10(page, 'Add Media');
      await expect(
        dlg.getByText('You need a Pro membership to add videos and images to your match feed.'),
      ).toBeVisible();
      await parkPointer(page);
      await shot(page, '10.8', '07-add-media-free', { clip: dlg, clipPad: 24, mask });
      await closeDialog10(page);
    } finally {
      expect(await fx.cancel(t.id), 'the throwaway must be cancelled').toBe(200);
    }
  });
});
