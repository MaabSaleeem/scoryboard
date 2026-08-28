// 13.8 - Brackets in a padel tournament.
//
// Fixture: KB 13 Padel Cup. A saved Swiss format creates a bracket called Swiss
// Finals whose slots arrive pre-seeded with group positions - 1st Group A, 4th
// Group A and so on - so there is nothing to fill in. Football's slots start
// empty (13.7, 13.9).
//
// The article was retitled: "and filling them automatically" is a group control,
// documented in 13.2. See briefs/13.md.
//
// Every dialog is opened and cancelled.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures13, headerIdentity, centre, onScreen, phaseCard, boardReady,
  boardText, matchCard,
} from '../../lib/kb';

test.describe('13.8 Padel brackets', () => {
  test('pre-seeded slots, and what can still be changed', async ({ page }) => {
    const fx = await fixtures13();
    const padel = await fx.detail(fx.padelCup);
    const knockout = padel.phases.find((p: any) => p.name === 'Knockout Phase');
    expect(knockout, 'KB 13 Padel Cup must have a Knockout Phase - run node scripts/seed-13.mjs')
      .toBeTruthy();

    await signInAs(page, fx.email, `/tournaments/${fx.padelCup}/format`);
    await quiet(page);
    await boardReady(page, boardText(page, 'Swiss Finals'));
    // The round labels render twice - a wide-layout copy and a mobile one - and
    // the mobile copy comes first in the DOM, so narrow to what is on screen.
    for (const round of ['Semi-finals', 'Final']) {
      await expect(onScreen(page.getByText(round, { exact: true })).first()).toBeVisible();
    }

    const card = phaseCard(page, knockout.id);
    await shot(page, '13.8', '01-padel-knockout-board', { clip: card });

    // The first match, and the two positions already in its slots.
    const match = await matchCard(page, 'Match Swiss Finals1');
    await centre(match);
    await expect(match.getByText('1st Group A', { exact: true })).toBeVisible();
    await expect(match.getByText('4th Group A', { exact: true })).toBeVisible();
    await shot(page, '13.8', '02-preseeded-slots', {
      mask: [headerIdentity(page)],
      annotate: match,
    });

    await page.locator('[aria-label="Edit slot 1"]').locator('visible=true').first().click();
    let dialog = onScreen(page.locator('[role="dialog"]')).first();
    await expect(dialog.getByText('Add Team', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Select or create a team for this match slot')).toBeVisible();
    await shot(page, '13.8', '03-edit-slot-dialog', { mask: [headerIdentity(page)] });
    await dialog.getByRole('button', { name: 'Close' }).first().click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);

    await page.locator('[aria-label="Edit Match 1"]').locator('visible=true').first().click();
    dialog = onScreen(page.locator('[role="dialog"]')).first();
    await expect(dialog.getByText('Edit match title', { exact: true })).toBeVisible();
    await shot(page, '13.8', '04-edit-match-title', { mask: [headerIdentity(page)] });
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);

    await page.locator('[aria-label="Edit Swiss Finals"]').locator('visible=true').first().click();
    dialog = onScreen(page.locator('[role="dialog"]')).first();
    await expect(dialog.getByText('Edit bracket', { exact: true })).toBeVisible();
    await shot(page, '13.8', '05-edit-bracket-dialog', { mask: [headerIdentity(page)] });
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);

    await page.locator('[aria-label="Delete Swiss Finals"]').locator('visible=true').first().click();
    dialog = onScreen(page.locator('[role="dialog"]')).first();
    await expect(dialog.getByText('Delete bracket', { exact: true })).toBeVisible();
    await shot(page, '13.8', '06-delete-bracket-confirm', { mask: [headerIdentity(page)] });
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);
    await expect(boardText(page, 'Swiss Finals')).toBeVisible();
  });
});
