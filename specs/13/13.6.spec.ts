// 13.6 - Reading the group standings table in a padel tournament.
//
// Fixture: KB 13 Padel Open, whose eight group matches all carry a score.
// Columns are PLD SCORE W D L PTS - no goals for, against or difference.
// Fixtures below the table are grouped by round.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures13, headerIdentity, centre, onScreen, boardReady,
  fixturesReady,
} from '../../lib/kb';

const PAIRS = ['Player 1 & Player 2', 'Player 3 & Player 4',
               'Player 5 & Player 6', 'Player 7 & Player 8'];

test.describe('13.6 Padel group standings', () => {
  test('the pairs table, its columns and the rounds below it', async ({ page }) => {
    const fx = await fixtures13();

    await signInAs(page, fx.email, `/tournaments/${fx.padelOpen}/results`);
    await quiet(page);
    await boardReady(page, onScreen(page.getByRole('button', { name: 'Group Phase', exact: true })).first());

    await onScreen(page.getByRole('button', { name: 'Group Phase', exact: true })).first().click();
    // Each pair appears in the table and again in every fixture it plays, so
    // match the first rather than asserting a single element.
    for (const pair of PAIRS) {
      await expect(page.getByText(pair, { exact: true }).first()).toBeVisible();
    }
    // SCORE is the column football does not have; assert it before capturing.
    await expect(page.getByText('SCORE', { exact: true }).first()).toBeVisible();
    // The fixtures list under the table is part of the same fetch and lands a
    // moment later. Wait for it, or the bottom third of this capture is a
    // half-built list and differs between runs.
    await fixturesReady(page);
    await shot(page, '13.6', '01-padel-results-group-phase', { mask: [headerIdentity(page)] });

    // See 13.5: the heading row is PLD's own parent, and the card is its parent.
    // Both layouts of the row are in the DOM, so narrow to the visible one.
    const headings = onScreen(page.getByText('PLD', { exact: true })).first()
      .locator('xpath=..');
    const table = headings.locator('xpath=..');
    await expect(table.getByText(PAIRS[0], { exact: true }).first()).toBeVisible();
    await centre(table);
    await shot(page, '13.6', '02-padel-standings-columns', {
      clip: table,
      annotate: headings,
      // Inset. The heading row is the top row of the clip, so an outline drawn
      // outside it falls off the top edge and only its lower border survives.
      annotatePad: -2,
    });

    const fixtures = onScreen(page.getByText('FIXTURES', { exact: true })).first();
    await centre(fixtures);
    // The round headings are "Round 1" in the DOM and uppercased by CSS, so
    // match them case-insensitively rather than by what the screen shows.
    await expect(page.getByText(/^Round 1$/i).first()).toBeVisible();
    await shot(page, '13.6', '03-padel-fixtures-by-round', { mask: [headerIdentity(page)] });
  });
});
