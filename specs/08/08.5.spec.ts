// 08.5 - Sharing, commenting on and deleting a leaderboard.
//
// Three things that live at the edges of a leaderboard, and one of them is not
// what it says it is.
//
// The share control opens a window offering a link, a copy button and a QR code,
// under the words "People with this link can view your board but can't change
// it." A signed-out visitor who opens that link is sent to /signin. The link is
// shareable; it is not public. The article says so.
//
// Commenting is members-only. POST /comments on a leaderboard answers 403 "Only
// leaderboard members can comment on or like leaderboard content" to anybody who
// is neither the Owner, an Administrator, nor a player on one of its teams - even
// though the composer is still drawn for them.
//
// Deleting is the one destructive thing in this collection that IS confirmed, and
// the confirmation is the article's subject. The window is photographed and then
// cancelled. docs/style-guide.md: "Photograph the dialog, do not submit it."
//
// Nothing here submits a comment either, and that is not fussiness:
// DELETE /comments/:commentId answers 401 even to the author, so a comment posted
// by a spec would sit on the fixture for good. The composer is photographed with
// the text typed in it.

import { test, expect } from '@playwright/test';
import {
  shot, quiet08, signInAs, onScreen,
  sidebarIdentity, moving08,
  fixtures08, KB08, KB08_LEAGUE, KB08_COMMENTS,
  leaderboardListReady, leaderboardCard, cardShareButton,
  dialog08, close08Dialog, shareLinkField, shareQrCode,
  boardReady08, boardViewsCount, commentBox, commentsPanel, commentTimes,
  settings08Ready, board08Section, KB08_TEAMS,
} from '../../lib/kb';

test.describe('08.5 Sharing, commenting on and deleting a leaderboard', () => {
  test('the share window, the comment thread, and the delete confirmation', async ({ page }) => {
    const fx = await fixtures08();

    await signInAs(page, KB08.pro, '/leaderboards');
    await quiet08(page);
    await leaderboardListReady(page, 1, [KB08_LEAGUE]);

    const mask = [sidebarIdentity(page, 'Mo KB'), ...moving08(page)];

    // 01 - where the share control is. A round icon button on the card's banner,
    // beside the kebab. It has no label of any kind, so the article has to point
    // at it, which is what the outline is for.
    const share = cardShareButton(page, KB08_LEAGUE);
    await expect(share).toBeVisible();
    await shot(page, '08.5', '01-card-share-control', {
      clip: leaderboardCard(page, KB08_LEAGUE), annotate: share, mask,
    });

    // 02 - the window. The link and the QR code are masked: both carry the
    // leaderboard's id, which changes whenever the seed is rebuilt, and
    // docs/style-guide.md masks share codes and QR codes. What the link looks
    // like goes in the prose instead.
    await share.click();
    const dlg = await dialog08(page, 'Share Leaderboard');
    await expect(dlg.getByText('Share public link', { exact: true })).toBeVisible();
    await expect(shareLinkField(page)).toHaveValue(
      new RegExp(`/leaderboards/${fx.leaderboard.id}$`),
    );
    await expect(shareLinkField(page)).toHaveAttribute('readonly', '');
    await shot(page, '08.5', '02-share-window', {
      clip: dlg, clipPad: 24, mask: [shareLinkField(page), shareQrCode(page)],
    });
    await close08Dialog(page);

    // 03 - the Comments panel. It sits below whichever board tab is open, so it
    // is reached by opening the board rather than a tab of its own. The thread is
    // the Administrator asking and the Owner answering, which is why it shows a
    // reply count rather than a single line. Timestamps masked: they are the day
    // the seed ran.
    await page.goto(`/leaderboards/${fx.leaderboard.id}`);
    await boardReady08(page, 3, onScreen(page.getByText(KB08_TEAMS.united, { exact: true })).first());
    await quiet08(page);
    const panel = await commentsPanel(page, 1);
    await expect(panel.getByText(KB08_COMMENTS[0].text)).toBeVisible();
    await expect(panel.getByText('View 1 more replies', { exact: true })).toBeVisible();
    await shot(page, '08.5', '03-comments-panel', {
      clip: panel,
      mask: [commentTimes(page), sidebarIdentity(page, 'Mo KB'), boardViewsCount(page), ...moving08(page)],
    });

    // 04 - the composer with something in it. Typed and left there: a comment
    // cannot be deleted afterwards, by anyone, so no spec may post one.
    const box = commentBox(page);
    await box.fill('Fixtures for October go up on Sunday.');
    await expect(box).toHaveValue('Fixtures for October go up on Sunday.');
    const submit = onScreen(panel.getByRole('button', { name: 'Comment', exact: true })).first();
    await shot(page, '08.5', '04-comment-typed', {
      clip: panel, annotate: submit,
      mask: [commentTimes(page), sidebarIdentity(page, 'Mo KB'), ...moving08(page)],
    });

    // 05 - the delete confirmation, from the settings screen's own section. The
    // card's kebab menu opens the identical window, which the article mentions
    // rather than photographing twice. Cancelled, never confirmed - deleting the
    // leaderboard would take the four played matches' statistics with it, and a
    // played match cannot be re-created.
    await page.goto(`/leaderboards/${fx.leaderboard.id}/settings`);
    await settings08Ready(page, KB08_LEAGUE);
    await quiet08(page);
    const danger = await board08Section(page, 'DELETE LEADERBOARD');
    await expect(danger.getByText(
      'This action will delete the leaderboard permanently and cannot be undone. Please proceed with caution.',
    )).toBeVisible();
    await onScreen(danger.getByRole('button', { name: 'Delete Leaderboard' })).first().click();
    const confirm = await dialog08(page, 'Delete Leaderboard');
    await expect(confirm.getByText(
      'This action cannot be undone. This will permanently delete the leaderboard and remove all associated data.',
    )).toBeVisible();
    await expect(onScreen(confirm.getByRole('button', { name: 'Cancel', exact: true }))).toHaveCount(1);
    await shot(page, '08.5', '05-delete-window', { clip: confirm, clipPad: 24 });
    await close08Dialog(page);

    // The leaderboard is still there. Asserted, because the one thing that must
    // never happen in this spec is the confirmation being clicked.
    const still = (await fx.leagueTeams()).map((t) => t.name).sort();
    expect(still).toEqual([KB08_TEAMS.city, KB08_TEAMS.rovers, KB08_TEAMS.united].sort());
  });
});
