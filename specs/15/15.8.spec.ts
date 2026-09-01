// 15.8 - Entering results, standings and team statistics.
//
// The map notes score entry as UNVERIFIED. It is now verified, and it is the
// heart of the article. A fixture card on Results has three states:
//
//   Scheduled  badge "Scheduled", the teams separated by VS, START and View, no
//              score boxes at all
//   Live       badge "Live", END instead of START, and VS replaced by two empty
//              score boxes
//   Ended      badge "Ended", a trophy on the winner, and the boxes still
//              editable
//
// Typing in a box fires `PUT /matches/:id/score` on its own - no Save button, no
// confirmation - and neither START nor END is confirmed either.
//
// What closes score entry is ending the PHASE, not ending a match. 13.11 owns the
// phase controls; 15.9 photographs the aftermath.
//
// Three fixtures:
//   KB 15 Sunday League  nothing played. The spec drives one fixture through all
//                        three states and then puts the group back.
//   KB 15 League         every match played. The standings and the team stats.
//   KB 15 Padel Cup      the padel section: SCORE where football has GF/GA/GD,
//                        Score where the leaderboard has Goals, fixtures grouped
//                        under ROUND 1..4, and a Rules and Regulations panel
//                        football has no equivalent of.
//
// This is the ONE spec in the collection that changes a fixture on purpose. It
// resets the group itself at the end, and `scripts/seed-15.mjs` resets the same
// group, so a run that dies half way is repaired by the next seed. No other
// article photographs KB 15 Sunday League's Results tab.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures15, freezeClock15, centre, onScreen,
  board15Ready, resultsCard, scoreBoxes, resetGroupFixtures, KB15_TOURNAMENTS,
} from '../../lib/kb';

test.describe('15.8 Entering results, standings and team statistics', () => {
  test('a fixture from Scheduled to Ended, the standings, the stats, and padel',
    async ({ page }) => {
      const fx = await fixtures15();
      const identity = page.getByText('Oona KB', { exact: true });

      // --- entering a result ---------------------------------------------------
      // Reset FIRST as well as last. This spec plays a fixture, and a run that
      // died anywhere after that left it Ended - so starting from whatever the
      // last run left behind is exactly the flake that has to be designed out.
      await resetGroupFixtures(fx.token, fx.sunday);
      await signInAs(page, fx.email, `/tournaments/${fx.sunday}/results`);
      await freezeClock15(page);
      await quiet(page);
      await board15Ready(page, onScreen(page.getByText(/^group a$/i)).first());

      const card = await resultsCard(page, 'KB 15 Terns', 'KB 15 Skuas');
      const start = card.getByRole('button', { name: 'START', exact: true });
      await expect(card.getByText('Scheduled', { exact: true })).toBeVisible();
      await expect(card.getByText('VS', { exact: true })).toBeVisible();
      await expect(scoreBoxes(card)).toHaveCount(0);
      await centre(card);
      await shot(page, '15.8', '01-fixture-scheduled', {
        clip: card, annotate: start,
      });

      await start.click();
      await expect(card.getByText('Live', { exact: true })).toBeVisible({ timeout: 30_000 });
      const boxes = scoreBoxes(card);
      await expect(boxes).toHaveCount(2);
      await expect(boxes.first()).toHaveValue('');
      await shot(page, '15.8', '02-fixture-live-empty-boxes', {
        clip: card, annotate: boxes.first(), annotatePad: 6,
      });

      // Typed, not submitted: there is no Save. The write is confirmed against
      // the API rather than against a toast, because there is no toast either.
      await boxes.first().fill('3');
      await boxes.last().fill('1');
      const groups = await fx.groups(fx.sunday);
      await expect
        .poll(async () => {
          const ms = await fx.groupMatches(fx.sunday, groups['Group A']);
          const m = ms.find((x: any) => x.homeTeam?.teamName === 'KB 15 Terns');
          return `${m?.homeTeamTotalGoals}-${m?.awayTeamTotalGoals}`;
        }, { timeout: 30_000 })
        .toBe('3-1');
      await shot(page, '15.8', '03-score-typed', { clip: card });

      const end = card.getByRole('button', { name: 'END', exact: true });
      await expect(end).toBeVisible();
      await end.click();
      await expect(card.getByText('Ended', { exact: true })).toBeVisible({ timeout: 30_000 });
      await shot(page, '15.8', '04-fixture-ended', { clip: card });

      // --- the standings, on a board where everything has been played ----------
      await page.goto(`/tournaments/${fx.league}/results`);
      await board15Ready(page, onScreen(page.getByText(/^group a$/i)).first());
      await quiet(page);
      // The table, header row AND team rows, without the fixtures below it. The
      // first attempt took `ancestor::div[.//*[text()="PTS"]][1]`, which is the
      // header row on its own - 2264 by 114 pixels of column letters.
      const table = page.locator('div')
        .filter({ hasText: /group a/i })
        .filter({ hasText: 'KB 15 Swifts' })
        .filter({ hasNotText: 'FIXTURES' })
        .last();
      await expect(table).toBeVisible();
      await centre(table);
      await shot(page, '15.8', '05-football-standings', { clip: table, clipPad: 12 });

      // There is a **View Stats** control that opens the same eight columns in a
      // dialog, unsorted - and it is NOT photographed, because at the viewport
      // this project captures at (1440 wide, docs/style-guide.md) its box is zero
      // pixels wide. It belongs to the narrow layout, where the eight columns do
      // not fit and the dialog is how you reach them. Asserted here so that a
      // later run notices if it ever becomes a desktop control.
      //
      // Asserted with a plain locator, not getByRole: a zero-width button is not
      // in the accessibility tree, so getByRole('button', {name: 'View Stats'})
      // finds nothing here and would prove only that the query was wrong.
      const viewStats = page.locator('button').filter({ hasText: 'View Stats' });
      await expect(viewStats).toHaveCount(1);
      expect(
        (await viewStats.first().boundingBox())?.width ?? 0,
        'View Stats is a narrow-layout control; it must stay off-screen at 1440',
      ).toBe(0);

      // The Leaderboard tab is the team statistics: top three as cards, the rest
      // as a table, and the stat column reads Goals on football.
      await page.goto(`/tournaments/${fx.league}/leaderboard`);
      await expect(page.getByText(/^Well played /)).toBeVisible({ timeout: 30_000 });
      await expect(onScreen(page.getByText('Goals', { exact: true })).first()).toBeVisible();
      await quiet(page);
      await shot(page, '15.8', '06-football-team-statistics', { mask: [identity] });

      // --- padel ---------------------------------------------------------------
      // Same screens, three differences: SCORE in the standings instead of the
      // three goal columns, fixtures grouped under ROUND headings, and a Rules
      // and Regulations panel.
      await page.goto(`/tournaments/${fx.padelCup}/results`);
      await board15Ready(page, onScreen(page.getByText(/^group a$/i)).first());
      await expect(onScreen(page.getByText(/^score$/i)).first()).toBeVisible();
      await expect(onScreen(page.getByText(/^round 1$/i)).first()).toBeVisible();
      await quiet(page);
      await shot(page, '15.8', '07-padel-standings-and-rounds', { mask: [identity] });

      const rules = onScreen(page.getByText(/^rules and regulations$/i)).first();
      await expect(rules).toBeVisible();
      // The rules panel is a <section>, not a div - which is why two earlier
      // attempts with `locator('div')` walked up to a 2000-pixel ancestor and
      // came back as four rounds of match cards clamped to the viewport.
      const rulesCard = page.locator('section')
        .filter({ hasText: /rules and regulations/i })
        .filter({ hasText: 'Teams remain fixed throughout the tournament.' })
        .last();
      await expect(rulesCard).toBeVisible();
      await centre(rulesCard);
      await shot(page, '15.8', '08-padel-rules', { clip: rulesCard, clipPad: 16 });

      await page.goto(`/tournaments/${fx.padelCup}/leaderboard`);
      await expect(page.getByText(/^Well played /)).toBeVisible({ timeout: 30_000 });
      // Score, not Goals. This is the difference the map asked for.
      await expect(onScreen(page.getByText('Score', { exact: true })).first()).toBeVisible();
      await expect(page.getByText('Goals', { exact: true })).toHaveCount(0);
      await quiet(page);
      await shot(page, '15.8', '09-padel-team-statistics', { mask: [identity] });

      // Put KB 15 Sunday League back: every fixture Scheduled, no scores.
      await resetGroupFixtures(fx.token, fx.sunday);
      const after = await fx.groupMatches(fx.sunday, (await fx.groups(fx.sunday))['Group A']);
      expect(after.every((m: any) => m.status === 'Scheduled'),
        '15.8 must leave KB 15 Sunday League unplayed').toBeTruthy();
    });
});
