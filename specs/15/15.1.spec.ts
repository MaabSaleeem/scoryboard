// 15.1 - Your tournament's public page.
//
// RETITLED. The map calls this "Publishing your tournament and your public page".
// There is no publishing step: `GET /tournaments` answers `isPublic: true` on
// every row and no screen in the app carries a control for it. So the article
// documents what the reader actually has - a public page that exists from the
// moment the tournament does - and says there is nothing to press.
//
// Fixtures: KB 15 Cup, whose group phase is scored so every public tab has real
// numbers in it, and KB 15 New Cup, which was created and never configured.
//
// Half the captures come from a SECOND browser context that has never signed in.
// That is the point of the article: this page really is public, unlike the
// leaderboard and match share links, which bounce a stranger to /signin.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures15, freezeClock15, centre, onScreen,
  board15Ready, publicContext, openPublicPage, publicTab, publicTabStrip,
  publicSettled, KB15_TOURNAMENTS,
} from '../../lib/kb';

test.describe('15.1 Your public tournament page', () => {
  test('the board, the share control, and every public tab', async ({ page, browser }) => {
    const fx = await fixtures15();

    // --- the organiser's own board ------------------------------------------
    await signInAs(page, fx.email, `/tournaments/${fx.cup}/participants`);
    await freezeClock15(page);
    await quiet(page);
    await board15Ready(page, onScreen(page.getByText('List Of All Teams (8)')).first());

    // Nine tabs. The reader needs to know the board is theirs and the public page
    // is a different thing, so the first capture is the whole board.
    const boardStrip = onScreen(page.getByRole('button', { name: 'Participants', exact: true }))
      .first().locator('xpath=ancestor::div[.//button][1]');
    await shot(page, '15.1', '01-organiser-board', {
      mask: [page.getByText('Oona KB', { exact: true })],
      annotate: boardStrip,
    });

    // The one control that has anything to do with going public: it hands over
    // the link. 15.2 opens it; here it is only pointed at.
    const share = page.getByRole('button', { name: 'Share tournament' });
    await centre(share);
    await shot(page, '15.1', '02-share-tournament-button', {
      mask: [page.getByText('Oona KB', { exact: true })],
      annotate: share,
    });

    // --- what a stranger sees ------------------------------------------------
    const ctx = await publicContext(browser);
    const out = await ctx.newPage();
    try {
      await openPublicPage(out, fx.cup, 'info');
      // Signed out, so there is a Sign In button where the sidebar would be.
      // That is the proof, and it must be in the frame.
      await expect(out.getByRole('button', { name: 'Sign In' })).toBeVisible();
      // The description comes from the info page, so it only appears once the
      // tournament itself has loaded - a better gate than the tab label.
      await publicSettled(out, /Everything you need for the day/);
      await shot(out, '15.1', '03-public-info-signed-out', { fullPage: false });

      const strip = await publicTabStrip(out);
      await shot(out, '15.1', '04-public-tab-strip', { clip: strip, clipPad: 12 });

      await publicTab(out, 'Standings').click();
      // Standings opens on the LAST phase, so a two-phase tournament lands on the
      // knockout bracket rather than the group table. Ask for the group phase.
      // The heading reads GROUP A and its markup is "Group A", upper-cased by
      // CSS - matched case-insensitively so the spec does not depend on which.
      await out.getByRole('button', { name: 'Group Phase', exact: true }).click();
      await expect(onScreen(out.getByText(/^group a$/i)).first()).toBeVisible();
      // The table paints its own shape with zeros in every cell before the
      // numbers land, so wait for something only a played fixture can say.
      await publicSettled(out, /WIN/);
      await shot(out, '15.1', '05-public-standings');

      await publicTab(out, 'Matches').click();
      // Group A is played and Group B is not, so this tab has something under
      // both headings. That is the whole reason the seed scores one group and
      // leaves the other alone.
      await expect(onScreen(out.getByText('Upcoming Matches', { exact: true })).first())
        .toBeVisible();
      await expect(out.getByText('No upcoming matches found')).toHaveCount(0);
      // The fixture cards arrive as skeletons first. Wait for a Group B team,
      // which is one of the unplayed fixtures this tab is showing.
      await publicSettled(out, /KB 15 (Whites|Oranges|Purples|Blacks)/);

      await shot(out, '15.1', '06-public-matches');

      await publicTab(out, 'Participants').click();
      await expect(onScreen(out.getByText('Teams (8)', { exact: true })).first()).toBeVisible();
      await publicSettled(out, /2 players/);
      await shot(out, '15.1', '07-public-participants');

      await publicTab(out, 'Leaderboard').click();
      await expect(out.getByText(/^Well played /)).toBeVisible();
      await publicSettled(out, /Well played KB 15 Blues/);
      await shot(out, '15.1', '08-public-leaderboard');

      // A tournament nobody has set up yet still has a page, and it says so in
      // zeros. This is the "before you start" state, and it is why the article
      // can promise there is nothing to publish.
      await openPublicPage(out, fx.newCup, 'info');
      await expect(out.getByText(KB15_TOURNAMENTS.newCup, { exact: true }).first()).toBeVisible();
      await expect(out.getByText('0 Teams joined')).toBeVisible();
      await publicSettled(out, /TOTAL MATCHES/i);
      await shot(out, '15.1', '09-public-info-not-set-up');
    } finally {
      await ctx.close();
    }
  });
});
