// 13.2 - How pairs are created and grouped in a padel tournament.
//
// Fixture: KB 13 Padel Cup. Swiss, 8 players, four generated pairs, nothing
// played. The pairs are not added by name: saving a padel format with
// padelMinPlayers 8 makes the server create "Player 1 & Player 2" and so on.
//
// Fill automatically and Clear live here, not on the bracket. They are group
// controls: PUT /tournament-groups/:id with autofillStrategy, or with
// clearAssignments. The Autofill dialog is opened and cancelled - running it
// would redraw the group, and the shot needs the dialog rather than its result.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures13, headerIdentity, centre, onScreen, phaseCard, boardReady,
  cancelDialog,
} from '../../lib/kb';

const PAIRS = ['Player 1 & Player 2', 'Player 3 & Player 4',
               'Player 5 & Player 6', 'Player 7 & Player 8'];

test.describe('13.2 Padel pairs and groups', () => {
  test('where the pairs come from, and how the draw is filled', async ({ page }) => {
    const fx = await fixtures13();
    const padel = await fx.detail(fx.padelCup);
    const groupPhase = padel.phases.find((p: any) => p.name === 'Group Phase');
    expect(groupPhase, 'KB 13 Padel Cup must have a Group Phase - run node scripts/seed-13.mjs')
      .toBeTruthy();

    await signInAs(page, fx.email, `/tournaments/${fx.padelCup}/format`);
    await quiet(page);
    await boardReady(page, page.getByText(PAIRS[0], { exact: true }));
    for (const pair of PAIRS) {
      await expect(page.getByText(pair, { exact: true })).toBeVisible();
    }

    const card = phaseCard(page, groupPhase.id);
    await centre(card);
    await shot(page, '13.2', '01-padel-group-with-pairs', {
      mask: [headerIdentity(page)],
      annotate: card,
    });

    await page.goto(`/tournaments/${fx.padelCup}/participants`);
    await quiet(page);
    await expect(page.getByText('List Of All Teams (4)', { exact: true })).toBeVisible();
    // The Participants table renders a wide and a narrow copy of each row, so
    // an unscoped match is ambiguous here even though it is not on the board.
    for (const pair of PAIRS) {
      await expect(page.getByText(pair, { exact: true }).first()).toBeVisible();
    }
    await shot(page, '13.2', '02-participants-pairs', { mask: [headerIdentity(page)] });

    await page.goto(`/tournaments/${fx.padelCup}/format`);
    await quiet(page);
    await boardReady(page, page.getByText(PAIRS[0], { exact: true }));

    const fill = onScreen(page.getByRole('button', { name: 'Fill automatically', exact: true })).first();
    const clear = onScreen(page.getByRole('button', { name: 'Clear', exact: true })).first();
    await expect(fill).toBeVisible();
    await expect(clear).toBeVisible();
    await centre(fill);
    // The row that holds both buttons: the step is about the pair together, and
    // an outline round Fill automatically alone leaves Clear outside it.
    const fillAndClear = fill.locator('xpath=..');
    await expect(fillAndClear.getByText('Clear', { exact: true })).toBeVisible();
    await shot(page, '13.2', '03-fill-automatically-and-clear', {
      mask: [headerIdentity(page)],
      annotate: fillAndClear,
    });

    await fill.click();
    const dialog = onScreen(page.locator('[role="dialog"]')).first();
    await expect(dialog.getByText('Autofill configuration', { exact: true })).toBeVisible();
    for (const logic of ['Strongest players on the first court', 'Evenly matched teams', 'Random']) {
      await expect(dialog.getByText(logic, { exact: true })).toBeVisible();
    }
    await shot(page, '13.2', '04-autofill-configuration', { mask: [headerIdentity(page)] });

    // Cancel. Running the autofill would redraw the group.
    await dialog.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);
  });
});
