// 13.5 - Reading the group standings table in a football tournament.
//
// Fixture: KB 13 Summer Cup, whose twelve group matches all carry a score, so
// the table has real numbers. KB 13 Cup would give a table of zeros, which
// teaches nothing about reading it.
//
// The Results tab opens on the Knockout Phase once the group phase is complete,
// so the spec chooses Group Phase first - as the reader has to.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures13, headerIdentity, centre, onScreen, boardReady,
  fixturesReady,
} from '../../lib/kb';

test.describe('13.5 Football group standings', () => {
  test('the table, its columns and the fixtures behind it', async ({ page }) => {
    const fx = await fixtures13();

    await signInAs(page, fx.email, `/tournaments/${fx.summerCup}/results`);
    await quiet(page);
    await boardReady(page, onScreen(page.getByRole('button', { name: 'Group Phase', exact: true })).first());

    await onScreen(page.getByRole('button', { name: 'Group Phase', exact: true })).first().click();
    // Every one of the eight, so the table cannot be caught half-rendered.
    for (const name of ['KB 13 Bears', 'KB 13 Hawks', 'KB 13 Owls', 'KB 13 Wolves',
                        'KB 13 Foxes', 'KB 13 Otters', 'KB 13 Herons', 'KB 13 Storks']) {
      await expect(page.getByText(name, { exact: true })).toBeVisible();
    }
    const groupPhaseTab = onScreen(page.getByRole('button', { name: 'Group Phase', exact: true })).first();
    // The fixtures list under the table is part of the same fetch and lands a
    // moment later. Wait for it, or the bottom third of this capture is a
    // half-built list and differs between runs.
    await fixturesReady(page);
    await shot(page, '13.5', '01-results-group-phase', {
      mask: [headerIdentity(page)],
      annotate: groupPhaseTab,
    });

    // The standings card, reached from its column headings rather than by
    // position. The screen renders a wide-layout and a narrow-layout copy of the
    // heading row, so take the one that is actually on screen: PLD's own parent
    // is the heading row, and that row's parent is the card.
    const headings = onScreen(page.getByText('PLD', { exact: true })).first()
      .locator('xpath=..');
    const table = headings.locator('xpath=..');
    await expect(table.getByText('KB 13 Bears', { exact: true })).toBeVisible();
    await centre(table);
    await shot(page, '13.5', '02-standings-columns', {
      clip: table,
      annotate: headings,
      // Inset. The heading row is the top row of the clip, so an outline drawn
      // outside it falls off the top edge and only its lower border survives.
      annotatePad: -2,
    });

    const fixtures = onScreen(page.getByText('FIXTURES', { exact: true })).first();
    await centre(fixtures);
    await shot(page, '13.5', '03-fixtures-with-scores', { mask: [headerIdentity(page)] });
  });
});
