// 13.12 - Changing a football format after you have saved it.
//
// The football mirror of 13.10. Same Configuration button on the Phases header,
// a different dialog behind it: `Football Configuration`, holding league type,
// match duration, the three points boxes, the group questions, Encounters and
// how many teams proceed to knockout.
//
// --- Why KB 13 Configuration and not KB 13 Cup ---------------------------
//
// This spec's subject is a dialog whose Save deletes and recreates every
// fixture in the tournament. KB 13 Cup is what seven other articles photograph.
// So 13.12 gets its own tournament, built by scripts/seed-13.mjs, and its start
// date rolls forward rather than being pinned the way the other six are.
//
// --- Why group and knockout ---------------------------------------------
//
// Measured on all three football templates, 2026-09-13:
//
//   group phase only     the group questions, Encounters, and a LEAGUE SCHEDULE
//                        block. No overflow question.
//   group and knockout   the group questions, Encounters, how many teams
//                        proceed to knockout, and the overflow question. No
//                        League schedule block.
//   knockout only        no group questions and no Encounters. The knockout
//                        count and the overflow question.
//
// The League schedule block sits behind FOOTBALL_GROUP_LEAGUE_SCHEDULER_ENABLED
// and nobody has confirmed that flag in production. Group and knockout is the
// one template whose dialog carries none of it, so every pixel here is off the
// flagged surface. 12.4 documents the block; this article links to it.
//
// --- The spec never confirms the save ------------------------------------
//
// Same rule 13.10 follows, for a sharper reason. Measured here, 2026-09-13:
//
//   * Save with NOTHING changed sends the PUT and the fixtures keep their ids.
//     Nothing is lost.
//   * Save with ANY value changed - a points box is enough, and points have
//     nothing to do with the schedule - deletes all 19 fixtures and recreates
//     them with new ids. A fixture that had been played 3-1 came back
//     Scheduled with no score.
//
// So shot 06 photographs the confirm dialog and the spec then Cancels it. That
// is docs/style-guide.md's "photograph the dialog, do not submit it": the
// warning is the article's subject, the click is not.
//
// --- The number fields take the stepper, not typing ----------------------
//
// Same trap 13.10 hit on padelCourtCount. fill() is swallowed and typed digits
// are prepended, so "1" over "2" leaves "21". ArrowDown on a focused field is
// the only input that works. Pressed exactly once.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures13, headerIdentity, centre, onScreen, boardReady,
} from '../../lib/kb';

test.describe('13.12 Changing a saved football format', () => {
  test('the Football Configuration dialog and the fixtures it rebuilds', async ({ page }) => {
    const fx = await fixtures13();

    // The seed asserts these before the run; asserted again here so a spec run
    // on its own fails on the fixture rather than inside a screenshot.
    const before = await fx.detail(fx.configuration);
    expect(before.format).toBe('GroupAndKnockout');
    expect([before.footballWinPoints, before.footballDrawPoints, before.footballLossPoints])
      .toEqual([3, 2, 0]);

    await signInAs(page, fx.email, `/tournaments/${fx.configuration}/format`);
    await quiet(page);
    // Gated on a team name, not on "GROUP PHASE". That heading is
    // CSS-uppercased from something else and is not that string in the DOM -
    // the same trap lib/kb.ts records for the LEVEL panel and the tile grids.
    await boardReady(page, page.getByText('KB 13 Larks', { exact: true }).first());

    const configuration = onScreen(
      page.getByRole('button', { name: 'Configuration', exact: true }),
    ).first();
    await expect(configuration).toBeVisible();
    await centre(configuration);
    await shot(page, '13.12', '01-configuration-button', {
      mask: [headerIdentity(page)],
      annotate: configuration,
    });

    await configuration.click();
    const dialog = onScreen(page.locator('[role="dialog"]')).first();
    await expect(dialog.getByText('Football Configuration', { exact: true })).toBeVisible();

    // Asserted before the capture rather than read off the picture afterwards:
    // this is the group-and-knockout dialog, so the knockout question is here
    // and the League schedule block is not.
    await expect(dialog.getByText('How many teams proceed to knockout? *', { exact: true }))
      .toBeVisible();
    await expect(dialog.getByText('League schedule', { exact: true })).toHaveCount(0);
    for (const label of ['League type *', 'Match duration (minutes) *',
      'Win points *', 'Draw points *', 'Loss points *', 'Encounters *']) {
      await expect(dialog.getByText(label, { exact: true })).toBeVisible();
    }

    // Clipped to the dialog, which SCROLLS INSIDE ITSELF. Unlike 13.10's, this
    // dialog's box is the window rather than the content, so the clip stops at
    // Encounters and the knockout question is below the fold. That is not a
    // fault to fix - it is what a reader sees - and shot 05 carries the lower
    // half, scrolled, with the knockout list open over it. Between the two the
    // whole dialog is covered, and the article tells the reader to scroll.
    await shot(page, '13.12', '02-football-configuration-dialog', { clip: dialog });

    // 03 - the three points boxes, at their defaults. A draw is worth 2.
    const win = dialog.locator('input[name="footballWinPoints"]');
    const draw = dialog.locator('input[name="footballDrawPoints"]');
    const loss = dialog.locator('input[name="footballLossPoints"]');
    await expect(win).toHaveValue('3');
    await expect(draw).toHaveValue('2');
    await expect(loss).toHaveValue('0');
    // The smallest box that holds all three. `ancestor::div[2]` reaches only the
    // Win points field group, and a clip of that is one field with the
    // annotation on Draw points falling outside the frame. Cost one run.
    const pointsBlock = dialog.locator(
      'div:has(input[name="footballWinPoints"]):has(input[name="footballLossPoints"])',
    ).last();
    await centre(pointsBlock);
    // Negative pad: the fields run the full width of the clip, so a positive
    // one puts the outline's left and right edges outside the frame and only
    // the top and bottom survive. docs/style-guide.md's rectangle has to be a
    // rectangle.
    await shot(page, '13.12', '03-points-fields', {
      clip: pointsBlock, annotate: draw, annotatePad: -3,
    });

    // 04 - Encounters. `1` is labelled rather than numbered, which is the thing
    // a reader cannot guess from the field.
    const encounters = dialog.locator('[role="combobox"]')
      .filter({ hasText: 'Play all teams in pool once' }).first();
    await centre(encounters);
    await encounters.click();
    const encounterList = onScreen(page.getByRole('listbox')).first();
    await expect(encounterList.getByText('Play all teams in pool once', { exact: true }))
      .toBeVisible();
    await expect(encounterList.getByText('10', { exact: true })).toBeVisible();
    await shot(page, '13.12', '04-encounters-options', { mask: [headerIdentity(page)] });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox').locator('visible=true')).toHaveCount(0);

    // 05 - how many teams proceed to knockout. The list is capped by the team
    // count: eight teams offer 2, 4 and 8 and nothing above it.
    // Matched on the whole value, not on the word "teams": Encounters reads
    // "Play all teams in pool once", so `hasText: 'teams'` picks that one
    // instead and the list never opens. Cost one run.
    const knockout = dialog.locator('[role="combobox"]')
      .filter({ hasText: /^\d+ teams$/ }).first();
    await centre(knockout);
    await knockout.click();
    const knockoutList = onScreen(page.getByRole('listbox')).first();
    await expect(knockoutList.getByText('2 teams', { exact: true })).toBeVisible();
    await expect(knockoutList.getByText('8 teams', { exact: true })).toBeVisible();
    await shot(page, '13.12', '05-knockout-teams-options', { mask: [headerIdentity(page)] });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox').locator('visible=true')).toHaveCount(0);

    // 06 - the warning. Draw points goes 2 -> 1 with one press of the stepper,
    // purely so Save has something to warn about. Nothing is sent: the confirm
    // is cancelled below, and confirming would throw away all 19 fixtures.
    await draw.click();
    await draw.press('ArrowDown');
    await expect(draw).toHaveValue('1');

    await dialog.getByRole('button', { name: 'Save', exact: true }).click();
    // Radix leaves the first dialog mounted under the confirm, so take the last.
    const confirm = onScreen(page.locator('[role="dialog"]')).last();
    await expect(confirm.getByText('Update Football Configuration?', { exact: true })).toBeVisible();
    await expect(
      confirm.getByText('Changing the configuration will reset the current scheduled matches.'
        + ' The matches will be recreated using the new configuration,'
        + ' and the current match setup will be lost.'),
    ).toBeVisible();
    await shot(page, '13.12', '06-update-confirm', { mask: [headerIdentity(page)] });

    // Cancel both, then prove the fixture is untouched - off the API, not off
    // the screen. If this ever fails, the seed's 3/2/0 check fails too and the
    // tournament has to be deleted and re-seeded.
    await confirm.getByRole('button', { name: 'Cancel', exact: true }).click();
    await onScreen(page.locator('[role="dialog"]')).last()
      .getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);

    const after = await fx.detail(fx.configuration);
    expect([after.footballWinPoints, after.footballDrawPoints, after.footballLossPoints])
      .toEqual([3, 2, 0]);
  });
});
