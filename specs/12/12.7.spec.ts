// 12.7 - Tournament crest, banner and phase names.
//
// The tournament has BOTH a banner and a crest, side by side under PROFILE
// APPEARANCE on the settings page. Each has its own edit and delete control.
// Neither is an <img>: the banner is a CSS background and the crest is a div of
// initials, which is why the first pass through this page - reading it as text -
// found only the crest and concluded there was no banner.
//
// Nothing is uploaded and no name is saved. The two upload targets are shown,
// and the phase and group rename dialogs are opened, then dismissed.

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
    await expect(page.getByText(/profile appearance/i)).toBeVisible();

    // The banner is a background image on a fixed-height panel, and the crest is
    // a circle of initials sitting on top of it. Neither carries an accessible
    // name, so both are matched on the layout class that makes them what they
    // are. If those change, this spec is the first place to look.
    const banner = page.locator('main div[class*="min-h-[280px]"]');
    const crest = page.locator('main div[class*="self-start"]');

    await shot(page, '12.7', '01-profile-appearance', {
      mask: [headerIdentity(page)],
      annotate: banner,
    });

    await shot(page, '12.7', '02-crest-upload-and-limits', {
      mask: [headerIdentity(page)],
      annotate: crest,
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
