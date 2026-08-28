// 13.1 - How teams are distributed into groups in a football tournament.
//
// Fixture: KB 13 Cup. Group and Knockout, 8 teams, 2 groups of 4, nothing
// played. Saving the format is what created the groups and dealt the teams into
// them; this article starts from that result.
//
// Nothing here mutates the tournament. The drag handle is annotated, not
// dragged: a mouse-move drag is the least reproducible thing Playwright does,
// and dragging persists, so the seed would have to repair the fixture after
// every run.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures13, headerIdentity, centre, onScreen, phaseCard, phasesBoard,
  boardReady,
} from '../../lib/kb';

test.describe('13.1 Teams in football groups', () => {
  test('the group phase board, and where the split comes from', async ({ page }) => {
    const fx = await fixtures13();
    const cup = await fx.detail(fx.cup);
    const groupPhase = cup.phases.find((p: any) => p.name === 'Group Phase');
    expect(groupPhase, 'KB 13 Cup must have a Group Phase - run node scripts/seed-13.mjs').toBeTruthy();

    await signInAs(page, fx.email, `/tournaments/${fx.cup}/format`);
    await quiet(page);
    await boardReady(page, page.getByText('KB 13 Reds', { exact: true }));

    // All eight, so the board cannot be caught half-filled.
    for (const name of ['KB 13 Reds', 'KB 13 Blues', 'KB 13 Greens', 'KB 13 Yellows',
                        'KB 13 Whites', 'KB 13 Blacks', 'KB 13 Purples', 'KB 13 Oranges']) {
      await expect(page.getByText(name, { exact: true })).toBeVisible();
    }
    // Clipped to the board: on eight teams it is taller than the viewport, and a
    // plain viewport shot cuts Group B off the bottom.
    const board = await phasesBoard(page, groupPhase.id);
    await shot(page, '13.1', '01-format-board', { clip: board });

    const card = phaseCard(page, groupPhase.id);
    await centre(card);
    await shot(page, '13.1', '02-group-phase-two-groups', {
      mask: [headerIdentity(page)],
      annotate: card,
    });

    await page.locator('[aria-label="Edit Group A"]').locator('visible=true').first().click();
    const dialog = onScreen(page.locator('[role="dialog"]')).first();
    await expect(dialog.getByText('Edit group', { exact: true })).toBeVisible();
    const teamCount = dialog.locator('input[type="number"]').first();
    await expect(teamCount).toHaveValue('4');
    await shot(page, '13.1', '03-edit-group-number-of-teams', {
      mask: [headerIdentity(page)],
      annotate: teamCount,
    });
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);

    const handle = page.locator('[aria-label="Reorder KB 13 Reds"]').locator('visible=true').first();
    await centre(handle);
    await shot(page, '13.1', '04-team-drag-handle', {
      mask: [headerIdentity(page)],
      annotate: handle,
    });
  });
});
