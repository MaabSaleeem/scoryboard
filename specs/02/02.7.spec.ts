// 02.7 - Your teams, rankings and match history.
//
// The four panels on the home page that answer "what have I actually done":
// Teams, Team rank, Matches and the leaderboards table at the foot of the page.
//
// Reads only. Nothing here writes anything.
//
// The Matches panel opens on Upcoming Matches and has to be switched to Past
// Matches, which is the article's fourth step. The match card carries the
// match's own date - 20 Aug 2026, not today - so it does not drift between runs
// and needs no mask.
//
// --- Shot 05, added 2026-09-08 -------------------------------------------
//
// 8sept-updates.md A10. The article opens "Four panels on your home page answer
// what have I actually played". A padel account has two of those four: Teams and
// Team rank. There is no Matches panel and no Leaderboards table, and there is a
// PADEL TOURNAMENTS panel instead.
//
// Captured full-page rather than clipped, which the style guide allows only when
// the article documents a whole page - and here the subject IS the whole page.
// Two of the four panels are missing, and an absence cannot be clipped to.

import { test, expect } from '@playwright/test';
import {
  shot, quiet, blockPromos, signInAs, onlyOurActivities, onScreen,
  fixtures02, statsReady, KB02, KB02_TEAMS,
  panel, viewsCount, notificationBadge, trendingTimes,
} from '../../lib/kb';

test.describe('02.7 Your teams, rankings and match history', () => {
  test('teams, team rank, past matches and the leaderboards table', async ({ page }) => {
    const fx = await fixtures02();
    await statsReady(fx.player.token, fx.player.playerId);

    await blockPromos(page);
    await onlyOurActivities(page);
    await signInAs(page, KB02.player, '/');
    await quiet(page);

    // 01 - every team the account is in, whether or not it owns them.
    const teams = await panel(page, 'TEAMS');
    await expect(teams.getByText(KB02_TEAMS.home, { exact: true })).toBeVisible();
    await shot(page, '02.7', '01-teams-panel', { clip: teams });

    // 02 - Team rank. It only says anything once a league match has finished;
    // before that it reads "No rankings yet".
    const rank = await panel(page, 'TEAM RANK');
    await expect(rank.getByText(/Place in/)).toBeVisible();
    await shot(page, '02.7', '02-team-rank', { clip: rank });

    // 03 - the match history, behind the Past Matches tab.
    const matches = await panel(page, 'MATCHES');
    const past = onScreen(matches.getByText('Past Matches', { exact: true })).first();
    await past.click();
    // Gate on the card's own content, not on the tab's state: the panel paints
    // the tabs before the fetch lands.
    await expect(matches.getByText(KB02_TEAMS.away, { exact: true })).toBeVisible();
    await expect(matches.getByText('20 Aug 2026')).toBeVisible();
    await shot(page, '02.7', '03-past-matches', { clip: matches, annotate: past });

    // 04 - the leaderboards table at the foot of the page, with your rank in each.
    const boards = await panel(page, 'Leaderboards');
    // The table renders each row twice - a wide layout and a narrow one - so the
    // name resolves to two elements. Take the one on screen.
    await expect(onScreen(boards.getByText("Otto's leaderboard", { exact: true })).first()).toBeVisible();
    await shot(page, '02.7', '04-leaderboards-table', {
      clip: boards, mask: [viewsCount(page), notificationBadge(page)],
    });
  });

  test('a padel account has two of those four panels, and one of its own', async ({ page }) => {
    const fx = await fixtures02();

    await blockPromos(page);
    await onlyOurActivities(page);
    await signInAs(page, KB02.padel, '/');
    await quiet(page);

    // Assert the shape before photographing it. Teams and Team rank survive on
    // the padel side; the Matches panel and the Leaderboards table do not, and
    // PADEL TOURNAMENTS stands where the Leaderboards table would be.
    await expect(onScreen(page.getByText('Perry KB', { exact: true })).first()).toBeVisible();
    await panel(page, 'TEAM RANK');
    await panel(page, 'TEAMS');
    await expect(onScreen(page.getByText('PADEL TOURNAMENTS', { exact: true })).first())
      .toBeVisible();
    await expect(page.locator('main h3').filter({ hasText: /^MATCHES$/i })).toHaveCount(0);
    await expect(page.locator('main h3').filter({ hasText: /^Leaderboards$/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Create Match' })).toHaveCount(0);

    // 05 - the whole page. The Trending strip's stamps are relative and move
    // every run, so they are masked; the panels are the subject and are not.
    await shot(page, '02.7', '05-padel-home-panels', {
      fullPage: true,
      mask: [viewsCount(page), notificationBadge(page), trendingTimes(page)],
    });
  });
});
