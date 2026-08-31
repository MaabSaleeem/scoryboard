// 08.3 - Adding and removing teams.
//
// The Teams section of /leaderboards/:id/settings. Add Team opens a window with a
// single search box; picking a team and selecting Continue puts it straight into
// the league.
//
// Removing has no confirmation at all. One click on a team row's Remove and
// DELETE /leaderboards/:id/teams/:teamId has already fired. That is the article's
// warning and it is why this spec is the only one allowed near that button.
//
// The map's six shots assumed a remove-confirmation window to photograph. There
// is none, so the sixth shot is the Remove control on the row instead, outlined
// but not yet used. See briefs/08.md.
//
// This spec MUTATES the fixture: it adds KB 08 Athletic and takes it out again.
// It restores the league in a `finally` whether or not it got that far -
// docs/style-guide.md, "a spec that consumes or mutates a fixture puts it back
// itself". 08.4 photographs a table with exactly three rows.

import { test, expect } from '@playwright/test';
import {
  shot, quiet08, signInAs, onScreen,
  sidebarIdentity, moving08,
  fixtures08, table08Ready, restoreLeagueTeams,
  KB08, KB08_LEAGUE, KB08_TEAMS,
  leaderboardListReady, loadOwnTeams08, settings08Ready, board08Section, dialog08,
  leagueTeamRow, leagueTeamRemove,
} from '../../lib/kb';

test.describe('08.3 Adding and removing teams', () => {
  test('add a team to the league, then take it out again', async ({ page }) => {
    const fx = await fixtures08();
    await table08Ready(fx);

    // The league must start at three. If a crashed run left Athletic in, the
    // whole procedure below photographs the wrong counts.
    const before = await fx.leagueTeams();
    expect(before.map((t) => t.name).sort()).toEqual(
      [KB08_TEAMS.city, KB08_TEAMS.rovers, KB08_TEAMS.united].sort(),
    );

    await signInAs(page, KB08.pro, '/leaderboards');
    await leaderboardListReady(page, 1, [KB08_LEAGUE]);
    // Manage Teams first, and not for tidiness: only /teams fills the store
    // slice the app checks a team's ownership against, and without it every team
    // the reader owns is badged External on the screens below. See
    // loadOwnTeams08().
    await loadOwnTeams08(page, KB08_TEAMS.united);
    await page.goto(`/leaderboards/${fx.leaderboard.id}/settings`);
    await quiet08(page);
    await settings08Ready(page, KB08_LEAGUE);

    const mask = [sidebarIdentity(page, 'Mo KB'), ...moving08(page)];

    try {
      // 01 - the section as it stands. Three teams under "Teams joined", each
      // with its own Remove, and Add Team above them.
      const teams = await board08Section(page, 'TEAMS');
      await expect(teams.getByText(KB08_TEAMS.united, { exact: true })).toBeVisible();
      await expect(teams.getByText(KB08_TEAMS.rovers, { exact: true })).toBeVisible();
      await expect(teams.getByText(KB08_TEAMS.city, { exact: true })).toBeVisible();
      const addTeam = onScreen(teams.getByRole('button', { name: 'Add Team' })).first();
      await shot(page, '08.3', '01-teams-section-three', { clip: teams, annotate: addTeam, mask });

      // 02 - the window. One box, and Continue disabled until a team is in it.
      await addTeam.click();
      const dlg = await dialog08(page, 'Add Team');
      const search = onScreen(dlg.locator('input[name="team"]')).first();
      await expect(search).toHaveAttribute('placeholder', 'Search for a team');
      await expect(onScreen(dlg.getByRole('button', { name: 'Continue' })).first()).toBeDisabled();
      await shot(page, '08.3', '02-add-team-window', { clip: dlg, clipPad: 24, annotate: search });

      // 03 - the list of teams you can add. Opening the box offers your own teams
      // that are not in the league yet; typing searches the whole platform, which
      // is how somebody else's team can be added. Typed, so the capture shows the
      // search doing something rather than a bare list.
      await search.click();
      await search.fill('KB 08');
      const option = onScreen(page.getByText(KB08_TEAMS.athletic, { exact: true })).last();
      await expect(option).toBeVisible();
      // The three teams already in the league are filtered out of the results,
      // which is worth asserting: it is why a short search looks so narrow.
      await expect(onScreen(page.getByText(KB08_TEAMS.rovers, { exact: true }))).toHaveCount(1);
      await shot(page, '08.3', '03-add-team-picker', { clip: dlg, clipPad: 24, annotate: option });

      // 04 - the team chosen, and Continue live.
      await option.click();
      await expect(search).toHaveValue(KB08_TEAMS.athletic);
      const cont = onScreen(dlg.getByRole('button', { name: 'Continue' })).first();
      await expect(cont).toBeEnabled();
      await shot(page, '08.3', '04-add-team-chosen', { clip: dlg, clipPad: 24, annotate: cont });

      // 05 - four teams. Gate on the new row rather than on the window closing:
      // the section re-reads /leaderboards/:id/teams after the POST.
      await cont.click();
      const four = await board08Section(page, 'TEAMS');
      await expect(four.getByText(KB08_TEAMS.athletic, { exact: true })).toBeVisible();
      await shot(page, '08.3', '05-teams-section-four', {
        clip: four, annotate: leagueTeamRow(page, KB08_TEAMS.athletic), mask,
      });

      // 06 - the Remove that takes it out. Outlined, not yet used: the article's
      // point is that there is no second step after this click. Each row carries
      // two Remove buttons, one per layout, and only one has a box - hence
      // onScreen() inside leagueTeamRemove().
      const remove = leagueTeamRemove(page, KB08_TEAMS.athletic);
      await expect(remove).toBeVisible();
      await shot(page, '08.3', '06-team-row-remove', {
        clip: leagueTeamRow(page, KB08_TEAMS.athletic), clipPad: 16, annotate: remove,
      });

      // The click that restores the fixture. Not a capture - there is nothing new
      // to photograph, because nothing is asked and nothing is confirmed.
      await remove.click();
      const back = await board08Section(page, 'TEAMS');
      await expect(back.getByText(KB08_TEAMS.athletic, { exact: true })).toHaveCount(0);
    } finally {
      await restoreLeagueTeams(fx);
    }

    const after = await fx.leagueTeams();
    expect(after.map((t) => t.name).sort()).toEqual(before.map((t) => t.name).sort());
  });
});
