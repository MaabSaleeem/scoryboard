// 07.10 - Your team page: stats, matches, top players and followers.
//
// Reads only. Nothing here writes anything.
//
// The whole page depends on one thing the reader will never think about: **a
// match only writes statistics if it was played in a leaderboard.** The seed's
// one finished match carries a leaderboardId for exactly that reason; without
// it every tile on this page reads 0. See config/api.md.
//
// The tabs are routes, and their labels are upper-cased by CSS - so the
// accessible names are "Player Stats" and "Matches", not "PLAYER STATS" and
// "MATCHES". The same text-transform trap collections 14 and 01 hit.

import { test, expect } from '@playwright/test';
import {
  shot, quiet07, signInAs, unstickHeader, onScreen, centre,
  fixtures07, teamPageReady, teamTab, teamJoinedSince, teamViews, statTile,
  asUser, mintSession,
  sidebarIdentity, notificationBadge,
  KB07, KB07_PROFILES, KB07_TEAMS, KB07_STATS,
} from '../../lib/kb';

const MO = `${KB07_PROFILES.pro.name} ${KB07_PROFILES.pro.lastName}`;

test.describe('07.10 Your team page', () => {
  test('the header, the statistics, the matches and the player table', async ({ page }) => {
    const fx = await fixtures07();

    // Assert the fixture rather than assume it: if the match ever failed to
    // write its statistics, every tile below is a zero and the article is wrong.
    // Fail here, loudly, rather than ship a screenshot of an empty page.
    const token: string = (await mintSession(KB07.pro)).idToken;
    const stats = (await asUser(token, `/teams/${fx.teams.united}/stats`)).body?.data?.stats ?? {};
    for (const [k, v] of Object.entries(KB07_STATS)) {
      expect(stats[k], `KB 07 United ${k}`).toBe(v);
    }

    await signInAs(page, KB07.pro, `/teams/${fx.teams.united}`);
    await quiet07(page);
    await teamPageReady(page, KB07_TEAMS.united);
    await unstickHeader(page);
    const masks = [
      sidebarIdentity(page, MO), notificationBadge(page),
      teamJoinedSince(page), teamViews(page),
    ];

    // 01 - the header: crest, banner, name, and the three counters. Followers is
    // a count and nothing more - GET /teams/:id/followers exists but no screen
    // lists them, so the counter is what the article can show.
    // The header block is the white band the counters sit in - the third
    // ancestor of the Members label, and the only one that also holds the name.
    const members = onScreen(page.getByText('Members', { exact: true })).first();
    const header = members.locator('xpath=ancestor::div[contains(@class,"bg-white")][1]');
    await expect(header).toContainText(KB07_TEAMS.united);
    await expect(header).toContainText('Followers');
    await shot(page, '07.10', '01-team-header', { clip: header, mask: [teamJoinedSince(page), teamViews(page)] });

    // 02 - the statistics. Reached from the MATCHES tile's own grid rather than
    // by heading: the tiles have no heading of their own, and "MATCHES" is also
    // a tab, so a text match finds the tab first.
    // Matched case-insensitively, and that is not optional: the tiles are
    // upper-cased by CSS and the DOM underneath is inconsistent - "MATCHES" and
    // "WIN" are capitals in the DOM, "W/L Ratio" and "Clean Sheets" are not.
    // Collection 02 found the same on a player's profile.
    const tiles = statTile(page, 'w/l ratio')
      .locator('xpath=ancestor::div[contains(@class,"grid")][1]');
    await expect(tiles.getByText(/^clean sheets$/i)).toBeVisible();
    await expect(tiles.getByText(/^goals \/ conceded$/i)).toBeVisible();
    await centre(tiles);
    await shot(page, '07.10', '02-team-stats', { clip: tiles });

    // 03 - who scored them.
    const top = statTile(page, 'top scorer')
      .locator('xpath=ancestor::div[contains(@class,"grid")][1]');
    await expect(top.getByText(/^most assists$/i)).toBeVisible();
    await centre(top);
    await shot(page, '07.10', '03-top-players', { clip: top });

    // 04 - the match list. The panel opens on Upcoming Matches, so the article's
    // step is to switch to Past Matches - which is also where the finished match
    // is. Collection 02 hit the same thing on a player's profile.
    await teamTab(page, 'Matches');
    await quiet07(page);
    const past = onScreen(page.getByText('Past Matches', { exact: true })).first();
    await past.click();
    await expect(onScreen(page.getByText(KB07_TEAMS.rovers, { exact: true })).first()).toBeVisible();
    await unstickHeader(page);
    await centre(past);
    await shot(page, '07.10', '04-matches-past', { annotate: past, mask: masks });

    // 05 - and the per-player table behind Player Stats.
    await teamTab(page, 'Player Stats');
    await quiet07(page);
    const rank = onScreen(page.getByText('Rank', { exact: true })).first();
    await expect(rank).toBeVisible();
    // The table has no id, no role and no white card around it - its column
    // headers are bare divs in a CSS grid - so it is reached from the Rank
    // header and asserted to still hold the rest of the columns.
    //
    // The page renders the table twice: a wide copy inside `.hidden.xl:block`
    // and a narrow one. onScreen() above already picked the visible header, so
    // this ancestor is the wide copy's.
    const table = rank.locator('xpath=ancestor::div[contains(@class,"w-full")][1]');
    await expect(table.getByText('Assists', { exact: true }).first()).toBeVisible();
    await expect(table.getByText('Position', { exact: true }).first()).toBeVisible();
    await unstickHeader(page);
    await centre(table);
    await shot(page, '07.10', '05-player-stats', { clip: table });
  });
});
