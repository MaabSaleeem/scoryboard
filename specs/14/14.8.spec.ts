// 14.8 - Exporting your fixture list as a PDF.
//
// Fixture: KB 14 Cup, whose schedule is the generated one and whose two phases
// give the dialog three sections to offer - Group A, Group B and Bracket C.
//
// The spec stops at the point of export and cancels. Clicking Export downloads a
// file, and a file is not a screen: there is nothing further to photograph, and
// leaving a download in test-results serves no one. What the file contains was
// checked by hand during step 1 and is written up in briefs/14.md.
//
// Exporting needs Tournament Pro. On the Basic plan the button opens an upgrade
// dialog instead - "Tournament Pro is required to export fixtures." The organiser
// holds a free Tournament Pro grant, so this spec sees the real dialog.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures14, headerIdentity, centre, onScreen,
  scheduleReady, openDialog, cancelDialog,
} from '../../lib/kb';

test.describe('14.8 Exporting the fixture list', () => {
  test('the button, the dialog, and choosing what goes in the file', async ({ page }) => {
    const fx = await fixtures14();

    await signInAs(page, fx.email, `/tournaments/${fx.cup}/schedule`);
    await quiet(page);
    await scheduleReady(page);

    // The control sits above the groups and covers the whole tournament, not the
    // group you happen to be looking at.
    const exportButton = onScreen(page.getByRole('button', { name: 'Export Fixtures', exact: true })).first();
    await centre(exportButton);
    await shot(page, '14.8', '01-export-fixtures-button', {
      mask: [headerIdentity(page)],
      annotate: exportButton,
    });

    await exportButton.click();
    const dialog = openDialog(page);
    await expect(dialog.getByText('Export Fixtures', { exact: true })).toBeVisible();
    // PDF is chosen for you; Excel is the other option. Nothing is ticked under
    // Fixtures available, so Export is refused until the reader picks something -
    // which is the step people miss.
    await expect(dialog.locator('[role="radio"][value="pdf"]')).toHaveAttribute('data-state', 'checked');
    await expect(dialog.getByRole('button', { name: 'Export', exact: true })).toBeDisabled();
    await shot(page, '14.8', '02-export-dialog', { clip: dialog });

    // Select all ticks every section across both phases. The button then reads
    // Deselect all and the Selection chip flips from PARTIAL to ALL ON.
    await dialog.getByRole('button', { name: 'Select all' }).click();
    const exportAction = dialog.getByRole('button', { name: 'Export', exact: true });
    await expect(exportAction).toBeEnabled();
    await shot(page, '14.8', '03-all-sections-selected', {
      clip: dialog,
      annotate: exportAction,
    });

    // Cancelled. The export itself writes nothing to the tournament, but a
    // download here would only litter test-results.
    await cancelDialog(page);
  });
});
