// 15.9 - Participants, followers and completing a tournament.
//
// "Completing a tournament" needed re-scoping. There is no Complete control: the
// Prizes tab's Winner picker is broken (see 15.6 and config/api.md) and the
// phase controls belong to 13.11, which documents Start Next Phase, Undo and End
// Phase in full. What this article can honestly show is the AFTERMATH - what a
// tournament looks like once its last phase has ended - which is what a reader
// asking "is it over?" actually needs, and which 13.11 does not photograph.
//
// Fixtures: KB 15 Cup for the participants and the two followers, and KB 15 Done
// Cup, whose one phase the seed has ENDED. Ending a phase cannot be undone, which
// is exactly why the after state is a second fixture and not something this spec
// does - docs/style-guide.md, "Actions you can only do once".
//
// The padel note in the map is wording only: padel participants are pairs, so the
// same counts read as teams. No separate capture.
//
// Re-captured 2026-09-13 for 8sept-updates.md A15, shots 03, 04 and 06. Three
// changes, one of them the point of the exercise:
//
//   - 06: the football DRAW is now worth 2 points by default, so KB 15 Done
//     Cup's table reads 9/6/2/2 where it read 9/6/1/1. Ranking order unchanged.
//   - 06: the fixture cards now show each match's ACTUAL start time
//     (`startedAt`, 9:59 for all six - the seed started them in one burst)
//     rather than the scheduled 10:00, 10:10, 10:20. Product change, published
//     on the repo owner's instruction. It also grew a `WEEK 1` band.
//   - 03 and 04: layout only. The empty-referees panel and the followers dialog
//     both got taller. No content changed; taken with the rest so one article
//     does not mix two versions of the app.
//
// 01, 02 and 05 came back byte-identical and keep their published filenames.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures15, freezeClock15, centre, onScreen,
  board15Ready, participantsSubTab, openDialog, cancelDialog, publicContext,
  signInThenPublic, resultsCard, scoreBoxes, KB15,
} from '../../lib/kb';

test.describe('15.9 Participants, followers and completing a tournament', () => {
  test('teams, players, referees, followers, and a tournament that is over',
    async ({ page, browser }) => {
      const fx = await fixtures15();
      const identity = page.getByText('Oona KB', { exact: true });

      await signInAs(page, fx.email, `/tournaments/${fx.cup}/participants`);
      await freezeClock15(page);
      await quiet(page);
      await board15Ready(page, onScreen(page.getByText('List Of All Teams (8)')).first());

      // Teams: eight of them, with a live member count and a per-row Add player.
      // Six are empty, which is what a tournament looks like the week before it
      // runs - the counts are the point of the capture.
      await shot(page, '15.9', '01-participants-teams', { mask: [identity] });

      await participantsSubTab(page, 'Players');
      await expect(onScreen(page.getByText('Players (3)', { exact: true })).first())
        .toBeVisible({ timeout: 30_000 });
      await quiet(page);
      await shot(page, '15.9', '02-participants-players', { mask: [identity] });

      // Referees are a third list, and it is empty here. 12.9 documents adding
      // one; this capture is only so a reader knows where they turn up.
      await participantsSubTab(page, 'Referees');
      const addReferee = page.getByRole('button', { name: 'Add Referee', exact: true });
      await expect(onScreen(page.getByText('No referees added yet', { exact: true })).first())
        .toBeVisible({ timeout: 30_000 });
      await quiet(page);
      await shot(page, '15.9', '03-participants-referees-empty', {
        mask: [identity], annotate: addReferee,
      });

      // Followers. The count in the header is a control; it opens the list, and
      // every row carries a Follow button of its own so an organiser can follow
      // a follower back.
      const followers = page.getByRole('button', { name: '2 Followers' });
      await centre(followers);
      await followers.click();
      const dialog = openDialog(page);
      await expect(dialog.getByText('Followers (2)')).toBeVisible({ timeout: 30_000 });
      // The heading is drawn from the count in the header, which the page already
      // has - so it appears while the list itself is still three grey rows. The
      // first pass of this capture was exactly that. Wait for the names.
      await expect(dialog.getByText('Fred KB', { exact: true })).toBeVisible({ timeout: 30_000 });
      await expect(dialog.getByText('Otto KB', { exact: true })).toBeVisible();
      await expect(dialog.locator('.animate-pulse')).toHaveCount(0);
      await shot(page, '15.9', '04-followers-dialog', { clip: dialog, clipPad: 24 });
      await cancelDialog(page);

      // The other side of it: what a follower's own view of the header says.
      const ctx = await publicContext(browser);
      const out = await ctx.newPage();
      try {
        await signInThenPublic(out, KB15.free, `/tournament/${fx.cup}/info`);
        await freezeClock15(out);
        await quiet(out);
        const unfollow = out.getByRole('button', { name: 'Unfollow' });
        await expect(unfollow).toBeVisible({ timeout: 30_000 });
        // The block that holds the crest, the title, the control and the two
        // counts. Composed with `has` and `hasText` rather than an xpath on
        // text(): the counts sit in a control whose label is split across text
        // nodes, so `contains(text(),"Followers")` matches nothing. `.last()`
        // takes the innermost div that satisfies both, because a locator returns
        // document order and every ancestor comes first.
        const header = out.locator('div')
          .filter({ has: out.getByRole('button', { name: 'Unfollow' }) })
          .filter({ hasText: /Followers/ })
          .last();
        await expect(header).toBeVisible();
        await shot(out, '15.9', '05-unfollow-in-the-header', {
          clip: header, clipPad: 20, annotate: unfollow,
        });
      } finally {
        await ctx.close();
      }

      // --- a tournament that is over -------------------------------------------
      // KB 15 Done Cup's phase has ended. Three things go at once: the score
      // boxes become plain text, START and END disappear from every card, and the
      // phase banner is gone. That is what "over" looks like, and nothing in the
      // app says the word.
      await page.goto(`/tournaments/${fx.doneCup}/results`);
      await board15Ready(page, onScreen(page.getByText(/^group a$/i)).first());
      const doneCard = await resultsCard(page, 'KB 15 Larks', 'KB 15 Finches');
      await expect(doneCard.getByText('Ended', { exact: true })).toBeVisible();
      await expect(scoreBoxes(doneCard)).toHaveCount(0);
      await expect(doneCard.getByRole('button', { name: 'START', exact: true })).toHaveCount(0);
      await expect(doneCard.getByRole('button', { name: 'END', exact: true })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'End Phase', exact: true })).toHaveCount(0);
      await quiet(page);
      await shot(page, '15.9', '06-tournament-over', { mask: [identity] });
    });
});
