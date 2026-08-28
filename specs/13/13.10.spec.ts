// 13.10 - Changing a padel format after you have saved it.
//
// Fixture: KB 13 Padel Cup. Configuration is a button in the Phases header, not
// a sub-tab as the article map says. It opens the Padel Configuration dialog,
// which holds every value the second step of the format screen asked for plus
// the win, loss and draw points.
//
// Saving raises a second dialog warning that the scheduled matches are reset and
// recreated. The spec CANCELS it: confirming would rebuild the fixture that
// 13.2, 13.4 and 13.8 photograph. scripts/seed-13.mjs resets every padel
// configuration value anyway, in case a run is interrupted after the confirm.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures13, headerIdentity, centre, onScreen, boardReady,
} from '../../lib/kb';

test.describe('13.10 Changing a saved padel format', () => {
  test('the Configuration dialog and the reset it warns about', async ({ page }) => {
    const fx = await fixtures13();

    await signInAs(page, fx.email, `/tournaments/${fx.padelCup}/format`);
    await quiet(page);
    await boardReady(page, page.getByText('Player 1 & Player 2', { exact: true }));

    const configuration = onScreen(
      page.getByRole('button', { name: 'Configuration', exact: true }),
    ).first();
    await expect(configuration).toBeVisible();
    await centre(configuration);
    await shot(page, '13.10', '01-configuration-button', {
      mask: [headerIdentity(page)],
      annotate: configuration,
    });

    await configuration.click();
    const dialog = onScreen(page.locator('[role="dialog"]')).first();
    await expect(dialog.getByText('Padel Configuration', { exact: true })).toBeVisible();
    // The three the format screen never showed.
    for (const label of ['Win points *', 'Loss points *', 'Draw points *']) {
      await expect(dialog.getByText(label, { exact: true })).toBeVisible();
    }
    // Clipped to the dialog. It is taller than the viewport, so a viewport shot
    // cuts the win, loss and draw points off - and those three are the fields
    // the format screen never showed, which is half the point of this article.
    await shot(page, '13.10', '02-padel-configuration-dialog', { clip: dialog });

    // Scoring: the combobox that currently reads 24.
    const scoring = dialog.locator('[role="combobox"]').filter({ hasText: '24' }).first();
    await scoring.click();
    const options = onScreen(page.getByRole('listbox')).first();
    await expect(options.getByText('Custom', { exact: true })).toBeVisible();
    await shot(page, '13.10', '03-scoring-options', { mask: [headerIdentity(page)] });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox').locator('visible=true')).toHaveCount(0);

    // Courts goes from 4 to 3 with one press of the stepper.
    //
    // Not fill(), and not typing. These number fields put the caret back at
    // position 0 on every render, so Backspace never deletes and typed digits
    // are prepended - typing "2" over "4" leaves "42". fill() is swallowed
    // outright. The stepper is the only input the field takes reliably, and a
    // second ArrowDown in the same run puts the value back up to 4, so press it
    // exactly once. Reported in briefs/13.md, open question 6.
    const courts = dialog.locator('input[name="padelCourtCount"]');
    await expect(courts).toHaveValue('4');
    await courts.click();
    await courts.press('ArrowDown');
    await expect(courts).toHaveValue('3');
    await shot(page, '13.10', '04-courts-field', {
      mask: [headerIdentity(page)],
      annotate: courts,
    });

    await dialog.getByRole('button', { name: 'Save', exact: true }).click();
    // Radix leaves the first dialog mounted under the confirm, so take the last.
    const confirm = onScreen(page.locator('[role="dialog"]')).last();
    await expect(confirm.getByText('Update Padel Configuration?', { exact: true })).toBeVisible();
    await expect(
      confirm.getByText('Changing the configuration will reset the current scheduled matches.'
        + ' The matches will be recreated using the new configuration,'
        + ' and the current match setup will be lost.'),
    ).toBeVisible();
    await shot(page, '13.10', '05-update-confirm', { mask: [headerIdentity(page)] });

    // Cancel both. Nothing is saved and the fixture is unchanged.
    await confirm.getByRole('button', { name: 'Cancel', exact: true }).click();
    await onScreen(page.locator('[role="dialog"]')).last()
      .getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);
  });
});
