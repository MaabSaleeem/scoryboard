// 11.2 - How team and player statistics are calculated.
//
// Three screens, one point. Your own ten tiles on Home say Matches 3. The same
// ten tiles on KB 11 Rovers say Matches 4. The Player Stats table shows why:
// there is a match the team played and you were not in the lineup for.
//
// The fixture is built for exactly this - see lib/fixtures-11.mjs. Rovers beat
// KB 11 Athletic 4-0 on 27 August with Pia left out.
//
// Reads only. Nothing here writes anything.
//
// The MATCHES tile is annotated in both grids, which is the one comparison this
// article exists to make. It is one annotation per capture, as the style guide
// asks; the two together are the argument.

import { test, expect } from '@playwright/test';
import {
  shot, quiet, blockPromos, signInAs, onScreen,
  fixtures11, stats11Ready, KB11, KB11_TEAMS, KB11_PROFILES,
  statTiles, statTile, teamStatTiles, teamTab, teamPageReady,
  playerStatsTable, playerStatsRow,
  cardTile, notificationBadge, viewsCount,
} from '../../lib/kb';

/** The tile a label belongs to, rather than the label itself. */
const tileOf = (label: ReturnType<typeof statTile>) =>
  label.locator('xpath=ancestor::div[contains(@class,"rounded-lg")][contains(@class,"border")][1]');

test.describe('11.2 How team and player statistics are calculated', () => {
  test('your tiles, the team tiles, and the per-player table', async ({ page }) => {
    const fx = await fixtures11();
    await stats11Ready(fx);

    await blockPromos(page);
    await signInAs(page, KB11.player, '/');
    await quiet(page);

    // 01 - your own ten tiles. Home IS the signed-in player's profile, so no
    // navigation is needed and the article does not invent any.
    const mine = await statTiles(page);
    await expect(mine.getByText(/^goals scored$/i)).toBeVisible();
    await expect(mine.getByText(/^player of the match$/i)).toBeVisible();
    const myMatches = tileOf(onScreen(mine.getByText(/^matches$/i)).first());
    await expect(myMatches).toContainText('3');
    // clipPad, not a bare clip. The MATCHES tile is in the grid's top-left
    // corner, so its outline is drawn outside the grid's own box on two sides -
    // the first run came back with the left and top edges of the rectangle
    // missing. The padding also stops the bottom row sitting flush against the
    // frame.
    await shot(page, '11.2', '01-player-stat-tiles', {
      clip: mine, clipPad: 12, annotate: myMatches,
    });

    // 02 - the same grid on the team, reading 4. Told apart from the player grid
    // by Clean sheets and Winning Streaks, which only the team has.
    await page.goto(`/teams/${fx.team.home}`);
    await teamPageReady(page, KB11_TEAMS.home);
    await quiet(page);
    const theirs = await teamStatTiles(page);
    await expect(theirs.getByText(/^clean sheets$/i)).toBeVisible();
    // Both card tiles are in this grid and both are labelled CARD. Asserted
    // here so a spec failure names the problem if the swatches ever change.
    await expect(cardTile(page, 'red')).toBeVisible();
    await expect(cardTile(page, 'yellow')).toBeVisible();
    const teamMatches = tileOf(onScreen(theirs.getByText(/^matches$/i)).first());
    await expect(teamMatches).toContainText('4');
    await shot(page, '11.2', '02-team-stat-tiles', {
      clip: theirs, clipPad: 12, annotate: teamMatches,
    });

    // 03 - Player Stats. One row per member, and Pia's row reads 3 matches while
    // every other row reads 4. The tab is a route, so this navigates.
    //
    // Her row is the annotation because it is the article's whole argument. The
    // two Cards columns are the other thing worth pointing at, and this shot
    // cannot do both - the prose carries them instead.
    await teamTab(page, 'Player Stats');
    const table = await playerStatsTable(page);
    await expect(table.getByText('Rory KB', { exact: true })).toBeVisible();
    await expect(table.getByText('Position', { exact: true })).toBeVisible();
    const myRow = playerStatsRow(table, KB11_PROFILES.player.position);
    await expect(myRow).toContainText(KB11_PROFILES.player.name);
    // Her row is the full width of the table, so the same padding is what keeps
    // the left and right edges of the rectangle in frame.
    await shot(page, '11.2', '03-player-stats-table', {
      clip: table, clipPad: 12, annotate: myRow,
      mask: [notificationBadge(page), viewsCount(page)],
    });
  });
});
