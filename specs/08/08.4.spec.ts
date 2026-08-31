// 08.4 - Leaderboard statistics, players and matches.
//
// Reading a leaderboard, rather than running one. The board header, the league
// table, the player grid and the fixture list.
//
// The fixture exists so the table can be read at all: four played matches
// between three teams, giving three rows with three different records. A match
// that is not in a leaderboard writes no statistics anywhere (config/api.md,
// found by collection 11), so every one of them carries the leaderboardId.
//
// Two things about the table the article has to be straight about, because a
// reader will look for them:
//
//   * There is no points column and no draws column. Win/Loss reads "1/1", and a
//     draw shows up only as the gap between Matches and Win + Loss. KB 08 Rovers
//     is the row that proves it: Matches 3, Win/Loss 1/1.
//   * There is no goals-conceded column either. Goals is goals scored.
//
// The Views tile is masked everywhere. It counts every account that has ever
// opened the board, and this collection signs four of them in.
//
// Reads only. Nothing here is created, edited or deleted.

import { test, expect } from '@playwright/test';
import {
  shot, quiet08, signInAs, onScreen,
  sidebarIdentity, moving08,
  fixtures08, table08Ready,
  KB08, KB08_LEAGUE, KB08_TEAMS, KB08_TOP_SCORER, KB08_VENUE,
  boardReady08, boardHeader, boardViewsCount, boardTab, matchesTab, teamFilter,
} from '../../lib/kb';

test.describe('08.4 Leaderboard statistics, players and matches', () => {
  test('the header, the league table, the player grid and the fixtures', async ({ page }) => {
    const fx = await fixtures08();
    await table08Ready(fx);

    await signInAs(page, KB08.pro, `/leaderboards/${fx.leaderboard.id}`);
    await quiet08(page);
    await boardReady08(page, 3, onScreen(page.getByText(KB08_TEAMS.united, { exact: true })).first());

    const mask = [sidebarIdentity(page, 'Mo KB'), boardViewsCount(page), ...moving08(page)];

    // 01 - the header. Crest, the word Leaderboard, the name, how many teams have
    // joined, the two tiles, Create Match, and the tab strip under it. Create
    // Match and the Payment tab are here because Mo owns the board: somebody who
    // is neither Owner nor Administrator sees neither, and no Views tile.
    const header = boardHeader(page);
    await expect(onScreen(page.getByRole('button', { name: 'Create Match' }))).toHaveCount(1);
    await expect(boardTab(page, 'Payment')).toBeVisible();
    await shot(page, '08.4', '01-board-header', { clip: header, mask });

    // 02 - the league table. Six columns: Rank, Teams, Members, Matches, Goals,
    // Win/Loss. The three rows are asserted because the article quotes them, and
    // because a table that came out in the wrong order would still look right.
    const table = onScreen(page.locator('main').getByText('Win/Loss', { exact: true })).first()
      .locator('xpath=ancestor::div[contains(@class,"rounded")][last()]');
    await expect(table.getByText('1st', { exact: true })).toBeVisible();
    await expect(table.getByText(KB08_TEAMS.united, { exact: true })).toBeVisible();
    await expect(table.getByText('2/0', { exact: true })).toBeVisible();
    // Rovers: three matches, one win, one loss - so the third was a draw, and
    // nothing on this table says so. That is the sentence the article is for.
    await expect(table.getByText('1/1', { exact: true })).toBeVisible();
    await expect(table.getByText('3rd', { exact: true })).toBeVisible();
    await shot(page, '08.4', '02-team-stats', { clip: table, mask });

    // 03 - the player grid. Rank, Players, Teams, Position, Matches, Goals,
    // Assists, and two card columns. A friend added by name has no position, so
    // the column reads "-" for most rows; Mo has one because he has an account.
    await boardTab(page, 'Player Stats').click();
    await expect(page).toHaveURL(new RegExp(`/leaderboards/${fx.leaderboard.id}/playerStats$`));
    const top = onScreen(page.locator('main').getByText(KB08_TOP_SCORER.playerName, { exact: true })).first();
    await expect(top).toBeVisible();
    const grid = top.locator('xpath=ancestor::div[contains(@class,"rounded")][last()]');
    await expect(grid.getByText('Assists', { exact: true })).toBeVisible();
    await expect(grid.getByText('1st', { exact: true })).toBeVisible();
    await shot(page, '08.4', '03-player-stats', { clip: grid, mask });

    // 04 - the fixture list. Upcoming is the tab it opens on, which is worth
    // showing first because it is what the reader sees. The card carries the
    // venue, the tag and both crests; a match with no venue would read
    // "Finish Setup" instead, and that is collection 09's article.
    await boardTab(page, 'Matches').click();
    await expect(page).toHaveURL(new RegExp(`/leaderboards/${fx.leaderboard.id}/matches$`));
    await expect(matchesTab(page, 'Upcoming Matches')).toHaveAttribute('data-state', 'active');
    const upcoming = onScreen(page.getByText(KB08_VENUE.name, { exact: true })).first()
      .locator('xpath=ancestor::div[contains(@class,"rounded")][last()]');
    await expect(upcoming.getByText('VS', { exact: true })).toBeVisible();
    await shot(page, '08.4', '04-matches-upcoming', { clip: upcoming, mask });

    // 05 - Past Matches. Four results, newest first, each with its score and a
    // Match Results button. A viewport shot rather than a clip: the point is the
    // whole list and its ordering, not one card.
    await matchesTab(page, 'Past Matches').click();
    await expect(matchesTab(page, 'Past Matches')).toHaveAttribute('data-state', 'active');
    await expect(onScreen(page.getByText('3 - 1', { exact: true })).first()).toBeVisible();
    await expect(onScreen(page.getByText('2 - 2', { exact: true })).first()).toBeVisible();
    await expect(onScreen(page.getByRole('button', { name: 'Match Results' }))).toHaveCount(4);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForFunction(() => window.scrollY === 0);
    await shot(page, '08.4', '05-matches-past', { mask });

    // 06 - the Select teams filter, which narrows the list to one team's
    // fixtures. Outlined open, so the reader can see it is a list of the teams in
    // the league rather than a free search.
    const filter = teamFilter(page);
    await expect(filter).toBeVisible();
    await filter.click();
    await expect(onScreen(page.getByText(KB08_TEAMS.city, { exact: true })).first()).toBeVisible();
    await shot(page, '08.4', '06-matches-team-filter', { mask });
  });
});
