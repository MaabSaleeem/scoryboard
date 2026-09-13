// 13.11 - Tournament phases: preview, start, end and undo.
//
// Shared between football and padel: the phase banner renders identically on
// both. Captured on football.
//
// Four fixtures, because the banner only shows what is currently possible:
//
//   KB 13 League         one phase, nothing played  -> no banner at all
//   KB 13 Cup            two phases, nothing played -> Start Next Phase, greyed
//   KB 13 Summer Cup     group phase scored         -> Start Next Phase, green
//   KB 13 Sunday League  one phase, every match scored -> End Phase
//
//
// Re-captured 2026-09-13 for 8sept-updates.md A15. TWO product changes are in
// these images, and only the first was expected:
//
//   1. The football DRAW is now worth 2 points by default, not 1, and it is
//      applied at READ time - a tournament whose stored config carries no
//      points fields recomputes anyway. KB 13 Summer Cup's Group A returned
//      7/5/3/1 in August and returns 8/7/3/2 today off identical W/D/L/GF/GA.
//      Ranking order is unchanged. Nothing in this spec asserts a number.
//   2. A Results-tab fixture card now shows the match's ACTUAL start time
//      (`startedAt`) where it used to show its scheduled kick-off, and while a
//      phase still allows score editing the score renders in input boxes with
//      no WIN/DRAW badge. The seed force-starts all twelve group matches inside
//      twenty seconds, so every card reads one repeated minute. Published on
//      the repo owner's instruction, 2026-09-13: accurate, and no prose here
//      refers to a kick-off time. NOT clock-driven - freezing the clock was
//      tried and changes nothing.
//
// This spec STARTS the knockout phase on KB 13 Summer Cup and then UNDOES it.
// That is the only way to photograph the started state and the Undo card, and
// undo is verified to restore the fixture exactly. It never clicks End Phase:
// ending a phase cannot be undone, so 09 and 10 photograph the card and its
// dialog and the dialog is cancelled.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures13, headerIdentity, centre, onScreen, boardReady, asUser,
  fixturesReady,
} from '../../lib/kb';

const groupPhaseTab = (page: any) =>
  onScreen(page.getByRole('button', { name: 'Group Phase', exact: true })).first();
const knockoutTab = (page: any) =>
  onScreen(page.getByRole('button', { name: 'Knockout Phase', exact: true })).first();

test.describe('13.11 Tournament phases', () => {
  test('no controls, greyed, green, preview, start, undo and end', async ({ page }) => {
    const fx = await fixtures13();

    // Own precondition: KB 13 Summer Cup's knockout phase must NOT be started.
    // This spec starts it and undoes it, so a run that dies in between would
    // otherwise leave the next run with nothing to start. Undo is addressed to
    // the phase the start was made FROM - the group phase, not the knockout.
    const phases = (await asUser(
      fx.token, `/tournament-phases?tournamentId=${fx.summerCup}&includeCompletion=true`,
    )).body.data ?? [];
    const knockoutPhase = phases.find((p: any) => p.name === 'Knockout Phase');
    const groupPhase = phases.find((p: any) => p.name === 'Group Phase');
    if (knockoutPhase?.started) {
      await asUser(fx.token, `/tournament-phases/${groupPhase._id}/undo-next-phase-start`,
        { method: 'POST', body: {} });
    }

    // --- 01. one phase, nothing played: no banner and no phase tabs ----------
    await signInAs(page, fx.email, `/tournaments/${fx.league}/results`);
    await quiet(page);
    // Each team appears in the table and again in every fixture it plays.
    await boardReady(page, page.getByText('KB 13 Kestrels', { exact: true }).first());
    await expect(page.getByRole('button', { name: 'Start Next Phase', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'End Phase', exact: true })).toHaveCount(0);
    await fixturesReady(page);
    await shot(page, '13.11', '01-no-phase-controls', { mask: [headerIdentity(page)] });

    // --- 02. two phases, nothing played: the banner, disabled ---------------
    await page.goto(`/tournaments/${fx.cup}/results`);
    await quiet(page);
    await boardReady(page, groupPhaseTab(page));
    await groupPhaseTab(page).click();
    const disabledBanner = page
      .getByText('This button becomes available after all matches in Group Phase have scores.')
      .locator('xpath=ancestor::div[2]');
    await expect(disabledBanner).toBeVisible();
    await expect(
      onScreen(page.getByRole('button', { name: 'Start Next Phase', exact: true })).first(),
    ).toBeDisabled();
    await fixturesReady(page);
    await centre(disabledBanner);
    await shot(page, '13.11', '02-start-disabled', {
      mask: [headerIdentity(page)],
      annotate: disabledBanner,
    });

    // --- 03. group phase scored: the same banner, enabled -------------------
    await page.goto(`/tournaments/${fx.summerCup}/results`);
    await quiet(page);
    await boardReady(page, groupPhaseTab(page));
    await groupPhaseTab(page).click();
    await expect(
      page.getByText('All matches in Group Phase have scores.'
        + ' Review the assignments and start Knockout Phase.'),
    ).toBeVisible();
    const startButton = onScreen(
      page.getByRole('button', { name: 'Start Next Phase', exact: true }),
    ).first();
    await expect(startButton).toBeEnabled();
    await fixturesReady(page);
    await centre(startButton);
    await shot(page, '13.11', '03-start-enabled', {
      mask: [headerIdentity(page)],
      annotate: startButton,
    });

    // --- 04, 05. the preview ------------------------------------------------
    await startButton.click();
    const preview = onScreen(page.locator('[role="dialog"]')).first();
    await expect(preview.getByText('Start Knockout Phase', { exact: true })).toBeVisible();
    // Both halves must have landed: the finished standings, and what each
    // next-phase slot resolves to.
    await expect(preview.getByText('KB 13 Bears', { exact: true }).first()).toBeVisible();
    await expect(preview.getByText('1st Group A', { exact: true }).first()).toBeVisible();
    await expect(preview.getByText('Send tournament phase summary email', { exact: true }))
      .toBeVisible();
    // Clipped to the dialog, not masked over the page behind it. This modal is
    // the widest in the app and the header-identity mask lands on top of its
    // explanatory paragraph.
    await shot(page, '13.11', '04-start-preview-modal', { clip: preview });

    // One assignment card rather than the whole right-hand column: the column
    // is taller than the modal's scroll area, and clipping to it stitches in
    // the page underneath.
    // ancestor::div[1], not [2]: the match name is a direct text child of the
    // card's blue header, so getByText resolves to the header itself and its
    // grandparent is the whole column - which is taller than the modal's scroll
    // area and stitches in the page underneath.
    const assignment = preview.getByText('Match C1', { exact: true })
      .locator('xpath=ancestor::div[1]');
    await expect(assignment.getByText('1st Group A', { exact: true })).toBeVisible();
    await expect(assignment.getByText('KB 13 Bears', { exact: true })).toBeVisible();
    await shot(page, '13.11', '05-preview-assignments', { clip: assignment });

    // --- 06, 07, 08. start, then undo --------------------------------------
    await preview.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);

    // The Undo card lives on the started phase's own tab, so go there first
    // rather than assuming the app has switched tabs for us.
    await knockoutTab(page).click();
    // Matched on the first sentence only. The rest of the card's copy differs
    // by a word between the card and the preview dialog, and pinning the whole
    // paragraph makes the spec fail on a copy edit rather than on a real change.
    const undoCopy = page.getByText('This phase was started from the previous phase.');
    await expect(undoCopy).toBeVisible();
    // The quarter-finals now hold real teams rather than TBD.
    await expect(onScreen(page.getByText('KB 13 Bears', { exact: true })).first()).toBeVisible();
    await expect(onScreen(page.getByText('TBD', { exact: true }))).toHaveCount(0);
    // No fixturesReady here: the knockout view renders bracket cards with a
    // START and a View button, not the status chips a group's fixture list has.
    await shot(page, '13.11', '06-knockout-started', { mask: [headerIdentity(page)] });

    const undoCard = undoCopy.locator('xpath=ancestor::div[2]');
    const undoButton = onScreen(page.getByRole('button', { name: 'Undo', exact: true })).first();
    await centre(undoCard);
    await shot(page, '13.11', '07-undo-card', {
      mask: [headerIdentity(page)],
      annotate: undoButton,
    });

    await undoButton.click();
    const undoConfirm = onScreen(page.locator('[role="dialog"]')).first();
    await expect(undoConfirm.getByText('Undo Knockout Phase', { exact: true })).toBeVisible();
    await expect(undoConfirm.getByText('Are you sure you want to undo this phase?')).toBeVisible();
    await shot(page, '13.11', '08-undo-confirm', { mask: [headerIdentity(page)] });

    // Undo for real: the fixture must be left exactly as the seed built it, or
    // a second run of this spec starts from a phase that is already started.
    await undoConfirm.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);
    await expect(
      page.getByText('All matches in Group Phase have scores.'
        + ' Review the assignments and start Knockout Phase.'),
    ).toBeVisible();

    // --- 09, 10. the last phase: End Phase ---------------------------------
    await page.goto(`/tournaments/${fx.sundayLeague}/results`);
    await quiet(page);
    await boardReady(page, page.getByText('KB 13 Robins', { exact: true }).first());
    const endCard = page.getByText('This is the last phase.').locator('xpath=ancestor::div[2]');
    const endButton = onScreen(page.getByRole('button', { name: 'End Phase', exact: true })).first();
    await expect(endCard).toBeVisible();
    await fixturesReady(page);
    await centre(endCard);
    await shot(page, '13.11', '09-end-phase-card', {
      mask: [headerIdentity(page)],
      annotate: endButton,
    });

    await endButton.click();
    const endConfirm = onScreen(page.locator('[role="dialog"]')).first();
    await expect(endConfirm.getByText('End Group Phase', { exact: true })).toBeVisible();
    await expect(
      endConfirm.getByText('This will mark all matches in Group Phase as finished.'),
    ).toBeVisible();
    await shot(page, '13.11', '10-end-phase-confirm', { mask: [headerIdentity(page)] });

    // Never confirmed. Ending a phase cannot be undone.
    await endConfirm.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);
  });
});
