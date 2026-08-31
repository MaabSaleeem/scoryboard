// 11.1 - Match facts: insights and Statistics so far.
//
// The Facts tab on a match. Two panels: Insights, which is five sentences about
// each team's last five games, and Statistics so far, which puts the two teams'
// records side by side.
//
// Retitled. The map called this "Match facts, insights, form and head-to-head".
// The app has no form guide and no head-to-head record - Statistics so far is
// each team's WHOLE record in the leaderboard, which the fixture proves: Rovers
// have played four and City three, and Rovers' biggest win on this page is 4-0
// against a third team. See briefs/11.md.
//
// Reads only, with one exception. Shot 04 is the empty state, which needs a
// match belonging to no leaderboard - withoutLeaderboard() creates one, hands it
// over and deletes it in a `finally`. A match outside a leaderboard writes no
// statistics at all, so it cannot disturb any other capture.

import { test, expect } from '@playwright/test';
import {
  shot, quiet, blockPromos, signInAs,
  fixtures11, stats11Ready, withoutLeaderboard, KB11, KB11_TEAMS, KB11_PROFILES,
  openMatch, matchTab, matchSectionCard, factsPanel,
  sidebarIdentity, notificationBadge,
} from '../../lib/kb';

test.describe('11.1 Match facts: insights and Statistics so far', () => {
  test('the Facts tab, its two panels, and what it shows with no leaderboard', async ({ page }) => {
    const fx = await fixtures11();
    await stats11Ready(fx);

    await blockPromos(page);
    await signInAs(page, KB11.player, '/');
    await quiet(page);

    // The 3-1 win. Gate on "Statistics so far" rather than on the tab strip: the
    // strip, the banner and the section headings all paint before the two facts
    // fetches land.
    await openMatch(page, fx.match.win, 'Statistics so far');

    // 01 - the match as it opens, with the FACTS tab outlined. A viewport shot,
    // not a clip: both of the tab strip's `[role="tablist"]` containers have zero
    // height and the tabs overflow them, so there is nothing to clip to - the
    // first run of this spec came back with the Pay tablist from the payment
    // section instead. The viewport also orients the reader, which a bare strip
    // did not.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForFunction(() => window.scrollY === 0);
    const facts = matchTab(page, 'FACTS');
    await expect(facts).toBeVisible();
    await shot(page, '11.1', '01-facts-tab', {
      annotate: facts,
      mask: [sidebarIdentity(page, `${KB11_PROFILES.player.name} ${KB11_PROFILES.player.lastName}`), notificationBadge(page)],
    });

    // 02 - Insights. Five lines per team, blue for the home team and red for the
    // away one. Asserted on the wording rather than on a count, so a sixth kind
    // of insight arriving does not fail the spec.
    const insights = await factsPanel(page, 'Insights');
    await expect(insights.getByText(new RegExp(`${KB11_TEAMS.home} has conceded`))).toBeVisible();
    await expect(insights.getByText(new RegExp(`${KB11_TEAMS.away} has conceded`))).toBeVisible();
    await expect(
      insights.getByText(/has used 2-1-1 the most in its last 5 games/).first(),
    ).toBeVisible();
    await shot(page, '11.1', '02-insights', { clip: insights });

    // 03 - Statistics so far. The row that carries the article is Biggest win:
    // Rovers' is 4-0 against KB 11 Athletic, a team that is not the opponent on
    // this page, so the panel cannot be a head-to-head record.
    //
    // Goals conceded per match is a dash for both teams. That is the app, not
    // the fixture - GET /matches/:id/facts-stats carries no conceded figure at
    // all. The article says so rather than pretending it is not there.
    const sofar = await factsPanel(page, 'Statistics so far');
    await expect(sofar.getByText('Biggest win', { exact: true })).toBeVisible();
    await expect(sofar.getByText('Clean sheets', { exact: true })).toBeVisible();
    // 4 - 0 is the Athletic result. It is on this page only because the panel
    // reads Rovers' whole record, so its absence would mean the article is wrong.
    await expect(sofar.getByText('4 - 0', { exact: true })).toBeVisible();
    await shot(page, '11.1', '03-statistics-so-far', { clip: sofar });

    // 04 - the empty state. The same two panels on a match that belongs to no
    // leaderboard, which is the only thing that empties them.
    await withoutLeaderboard(fx, async (matchId) => {
      await openMatch(page, matchId, 'No statistics available yet');
      await quiet(page);
      const card = matchSectionCard(page, 'facts');
      await expect(card.getByText('No insights available yet', { exact: true })).toBeVisible();
      await expect(card.getByText('No statistics available yet', { exact: true })).toBeVisible();
      await shot(page, '11.1', '04-facts-empty', { clip: card });
    });
  });
});
