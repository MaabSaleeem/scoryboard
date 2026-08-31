// 05.5 - Following players, teams and tournaments.
//
// Was collection 06's only article. Collection 06 was merged into 05 on
// 2026-08-31 at the repo owner's request, the way 03 went into 02 and 16 into
// 04. Its Intercom collection was empty, so nothing moved - this is a fresh
// build.
//
// --- what the article rests on ----------------------------------------------
//
// **One control, three places.** A player profile, a team page and a tournament
// page each carry the same Follow control in their own header, beside their
// counters, and it reads Follow or Unfollow. That is why the three captures
// look alike and why the article can describe them in one procedure.
//
// **The result is not shown in three places.** Followed players and teams are in
// the Following window on your own profile, under a Players tab and a Teams tab.
// A followed tournament is in NO list - not there, not on the Tournament screen,
// and no endpoint enumerates them. The article says so plainly, because a reader
// who follows a tournament will go looking.
//
// --- what this spec changes, and how it puts it back ------------------------
//
// Following is reversible in both directions, so unlike the rest of this
// collection there is no one-way action to work around. The spec follows
// KB05.FOLLOW_TARGET, photographs the result, and unfollows in a finally.
// Nothing else here writes: the team and the tournament are photographed in
// their Follow state and not selected, and the Following window is opened and
// closed.
//
// Every capture is clipped to a header or to a dialog. That is deliberate: all
// three of these pages carry a TRENDING feed of global activity, which
// docs/style-guide.md forbids in a capture and which drifts every run.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, blockPromos, shot, fixtures05, fixtures05Follow, followButton,
  followHeader, followStateReady, followCounter, ownProfileHeader, openFollowingWindow, closeDialogs,
  hideSidebarIdentity, joinedSince, viewsCount, setFollow, KB05,
} from '../../lib/kb';

const ARTICLE = '05.5';
const PAD = 20;

test.describe('05.5 Following players, teams and tournaments', () => {
  test('follow a player, a team and a tournament, and find them again', async ({ page }) => {
    test.setTimeout(300_000);
    const fx = await fixtures05();
    const fl = await fixtures05Follow();
    const target = fx[KB05.FOLLOW_TARGET as 'player'];
    let followed = false;

    await blockPromos(page);
    await signInAs(page, fx.free.email, '/friendList');
    await quiet(page);

    try {
      // 1. A player you do not follow yet.
      //
      // The header, not the page: a player profile carries a TRENDING feed of
      // global activity below it.
      await page.goto(`/player/${target.playerId}`);
      await quiet(page);
      await followStateReady(page, KB05.FOLLOW_BUTTON);
      const before = await followHeader(page);
      await expect(before).toContainText('Pete KB');
      await shot(page, ARTICLE, '01-player-follow', {
        clip: before, clipPad: PAD,
        annotate: followButton(page), annotatePad: 6,
        mask: [joinedSince(page)],
      });

      // 2. The same header once you follow. The control reads Unfollow and the
      //    Followers count has gone up by one.
      followed = true;
      await followButton(page).click();
      await followStateReady(page, KB05.UNFOLLOW_BUTTON);
      const after = await followHeader(page, KB05.UNFOLLOW_BUTTON);
      await shot(page, ARTICLE, '02-player-unfollow', {
        clip: after, clipPad: PAD,
        annotate: followButton(page, KB05.UNFOLLOW_BUTTON), annotatePad: 6,
        mask: [joinedSince(page)],
      });

      // 3. A team page. Same control, same place, and not selected here - the
      //    seed keeps this one unfollowed so the capture shows Follow.
      await page.goto(`/teams/${fl.unfollowedTeam.id}`);
      await quiet(page);
      await followStateReady(page, KB05.FOLLOW_BUTTON);
      const teamHeader = await followHeader(page);
      await expect(teamHeader).toContainText(fl.unfollowedTeam.name);
      await shot(page, ARTICLE, '03-team-follow', {
        clip: teamHeader, clipPad: PAD,
        annotate: followButton(page), annotatePad: 6,
        mask: [joinedSince(page)],
      });

      // 4. A tournament page. `/tournaments/:id` lands on its Info tab.
      await page.goto(`/tournaments/${fl.tournament.id}/info`);
      await quiet(page);
      await followStateReady(page, KB05.FOLLOW_BUTTON);
      const tournamentHeader = await followHeader(page);
      await expect(tournamentHeader).toContainText(fl.tournament.name);
      await shot(page, ARTICLE, '04-tournament-follow', {
        clip: tournamentHeader, clipPad: PAD,
        annotate: followButton(page), annotatePad: 6,
      });

      // 5. Where to find them again: the Following counter on your OWN profile.
      //
      // Views is masked - it rises every time any account opens the page,
      // including these specs. Joined Since is masked as an absolute date that
      // is not the subject. The Following counter is the subject and is not.
      await page.goto(`/player/${fx.free.playerId}`);
      await quiet(page);
      await hideSidebarIdentity(page, 'Marc KB');
      // Your own profile has no Follow control - you cannot follow yourself -
      // so the header is found from a counter instead.
      const mine = await ownProfileHeader(page, KB05.FOLLOWING_DIALOG.title);
      await expect(mine).toContainText('Marc KB');
      await shot(page, ARTICLE, '05-following-counter', {
        clip: mine, clipPad: PAD,
        annotate: followCounter(page, KB05.FOLLOWING_DIALOG.title), annotatePad: 6,
        mask: [joinedSince(page), viewsCount(page)],
      });

      // 6. The Following window, and the Unfollow beside each row.
      const window = await openFollowingWindow(page);
      const unfollow = window.getByRole('button', { name: KB05.FOLLOWING_DIALOG.unfollow }).first();
      await expect(unfollow).toBeVisible();
      await shot(page, ARTICLE, '06-following-window', {
        clip: window, clipPad: PAD, annotate: unfollow, annotatePad: 6,
      });
      // Not selected. It would unfollow the row the seed put there, and the
      // count in the tab labels is what the next run photographs.
      await closeDialogs(page);
    } finally {
      // Put the one follow this spec performed back. Unconditional would be
      // harmless - DELETE on something you do not follow is not an error - but
      // this keeps the log honest about what the run changed.
      if (followed) {
        await setFollow(fx.free.token, 'players', String(target.playerId), false);
      }
    }
  });
});
