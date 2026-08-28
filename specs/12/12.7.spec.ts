// 12.7 - Tournament crest and phase names.
//
// The map titles this "Tournament crest, banner and phase names". There is no
// tournament banner in this build - the settings page offers a crest only
// ("PROFILE APPEARANCE", JPG/GIF/PNG, 3MB max) and no banner control appears on
// the board, the settings page or the public page. See briefs/12.md, open
// question 4.
//
// Nothing is uploaded and no name is saved. The crest input is shown, and the
// phase and group rename controls are opened, then dismissed.

import { test, expect } from '@playwright/test';
import { signIn, quiet, shot, fixtures, headerIdentity } from '../../lib/kb';

test.describe('12.7 Crest and phase names', () => {
  test('the crest, the phase name and the group names', async ({ page }) => {
    const fx = await fixtures('organiser');

    await signIn(page, 'organiser', `/tournaments/${fx.cup}/settings`);
    await quiet(page);
    await page.getByText('Edit Tournament - KB Cup').waitFor();

    // The section headings are upper-cased by CSS. The DOM text is title case,
    // and Playwright matches the DOM, so match case-insensitively.
    const appearance = page.getByText(/profile appearance/i);
    await shot(page, '12.7', '01-profile-appearance', {
      mask: [headerIdentity(page)],
      annotate: appearance,
    });

    const limits = page.getByText('JPG, GIF or PNG. 3MB max.');
    await shot(page, '12.7', '02-crest-upload-and-limits', {
      mask: [headerIdentity(page)],
      annotate: limits,
    });

    // Phase and group names live on the Format tab once a format is saved.
    await page.goto(`/tournaments/${fx.cup}/format`);
    await quiet(page);
    // Wait for both groups, not just the phase heading: the panel fills in group
    // by group and a capture between the two is a different picture.
    await expect(page.getByText(/^group a$/i).first()).toBeVisible();
    await expect(page.getByText(/^group b$/i).first()).toBeVisible();
    await shot(page, '12.7', '03-phases-and-groups', { mask: [headerIdentity(page)] });

    // The rename pencils carry an aria-label but sit outside the accessibility
    // tree, so getByRole never finds them. Match the attribute directly, and
    // take the visible one - the page renders a wide and a narrow copy of each
    // row and the unused copy has a zero-sized box.
    const editPhase = page.locator('button[aria-label="Edit Group Phase"]:visible').first();
    await expect(editPhase).toBeVisible();
    await editPhase.click();
    await shot(page, '12.7', '04-rename-the-phase', {
      mask: [headerIdentity(page)],
      annotate: editPhase,
    });
    await page.keyboard.press('Escape');

    const editGroup = page.locator('button[aria-label="Edit Group A"]:visible').first();
    await expect(editGroup).toBeVisible();
    await editGroup.click();
    await shot(page, '12.7', '05-rename-a-group', {
      mask: [headerIdentity(page)],
      annotate: editGroup,
    });
    await page.keyboard.press('Escape');
    await expect(page.getByText(/^group a$/i).first()).toBeVisible();
  });
});
