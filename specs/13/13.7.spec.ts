// 13.7 - Brackets and knockout rounds in a football tournament.
//
// Fixture: KB 13 Cup. Saving Group and Knockout created one bracket, Bracket C,
// sized to the eight teams: Quarter-finals, Semi-finals, Final. The first round
// starts empty; every later round reads "Winner Match C1" and cannot be edited.
//
// Both dialogs are opened and cancelled. Nothing is renamed, resized or deleted.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures13, headerIdentity, centre, onScreen, phaseCard, boardReady,
  boardText, matchCard,
} from '../../lib/kb';

test.describe('13.7 Football brackets', () => {
  test('the bracket board, its rounds, its size and its delete', async ({ page }) => {
    const fx = await fixtures13();
    const cup = await fx.detail(fx.cup);
    const knockout = cup.phases.find((p: any) => p.name === 'Knockout Phase');
    expect(knockout, 'KB 13 Cup must have a Knockout Phase - run node scripts/seed-13.mjs').toBeTruthy();

    await signInAs(page, fx.email, `/tournaments/${fx.cup}/format`);
    await quiet(page);
    await boardReady(page, boardText(page, 'Bracket C'));
    // The round labels render twice - a wide-layout copy and a mobile one - and
    // the mobile copy comes first in the DOM, so narrow to what is on screen.
    for (const round of ['Quarter-finals', 'Semi-finals', 'Final']) {
      await expect(onScreen(page.getByText(round, { exact: true })).first()).toBeVisible();
    }

    const card = phaseCard(page, knockout.id);
    await shot(page, '13.7', '01-knockout-phase-board', { clip: card });

    const matchC1 = await matchCard(page, 'Match C1');
    await centre(matchC1);
    await shot(page, '13.7', '02-quarter-final-empty-slots', {
      mask: [headerIdentity(page)],
      annotate: matchC1,
    });

    const winnerSlot = boardText(page, 'Winner Match C1');
    await centre(winnerSlot);
    await shot(page, '13.7', '03-later-rounds-winner-slots', {
      mask: [headerIdentity(page)],
      annotate: winnerSlot,
    });

    await page.locator('[aria-label="Edit Bracket C"]').locator('visible=true').first().click();
    const dialog = onScreen(page.locator('[role="dialog"]')).first();
    await expect(dialog.getByText('Edit bracket', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Number of teams', { exact: true })).toBeVisible();
    await shot(page, '13.7', '04-edit-bracket-dialog', { mask: [headerIdentity(page)] });

    await dialog.locator('[role="combobox"]').first().click();
    const sizes = onScreen(page.getByRole('listbox')).first();
    for (const size of ['2 teams', '4 teams', '8 teams']) {
      await expect(sizes.getByText(size, { exact: true })).toBeVisible();
    }
    await shot(page, '13.7', '05-bracket-size-options', { mask: [headerIdentity(page)] });

    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox').locator('visible=true')).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);

    await page.locator('[aria-label="Delete Bracket C"]').locator('visible=true').first().click();
    const confirm = onScreen(page.locator('[role="dialog"]')).first();
    await expect(confirm.getByText('Delete bracket', { exact: true })).toBeVisible();
    await shot(page, '13.7', '06-delete-bracket-confirm', { mask: [headerIdentity(page)] });
    await confirm.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);
    await expect(boardText(page, 'Bracket C')).toBeVisible();
  });
});
