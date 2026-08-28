// 01.6 - The profile checklist in your sidebar.
//
// The checklist only exists while something is missing, and on a brand-new
// account exactly two things are: date of birth and bio. Neither is on the
// signup form, so every reader has them outstanding on their first day.
//
// That count is why scripts/seed-01.mjs goes to the trouble of filling gender,
// sports and position on the persona. An account left the way POST /admins/users
// makes it reads four missing fields, not one, and this article would be wrong.
//
// Reads only. Nothing here saves anything.

import { test, expect } from '@playwright/test';
import {
  shot, quiet01, blockPromos, signInWithPassword, unstickHeader,
  sidebarUserBlock, profileChecklistLine, settingsRow, KB01,
} from '../../lib/kb';

test.describe('01.6 The profile checklist in your sidebar', () => {
  test('the sidebar warning, and the two fields it is counting', async ({ page }) => {
    await blockPromos(page);
    await signInWithPassword(page, KB01.fresh, '/');
    await quiet01(page);

    // The block is collapsed until you select your own name.
    await page.getByText('Fresh KB', { exact: true }).first().click();
    const block = await sidebarUserBlock(page);
    const warning = profileChecklistLine(page);
    await expect(warning).toHaveText('Complete your profile (2)');

    // Not masked. The style guide masks the signed-in name where it is
    // incidental; here the block carrying the name IS the subject, and masking
    // it would black out most of a 255px-wide clip. Same call collection 12 made
    // about its allowance panel.
    await shot(page, '01.6', '01-sidebar-checklist', { clip: block, annotate: warning });

    // Selecting it lands on /profile-settings#date-of-birth-field - the app
    // jumps you to the first outstanding field rather than to the top of the
    // page. Worth knowing: the URL always carries that fragment, so the match
    // has to allow it.
    await page.getByText('Edit User Profile', { exact: true }).last().click();
    await page.waitForURL('**/profile-settings*', { timeout: 30_000 });
    await expect(page.getByText('Personal Details', { exact: true }).first()).toBeVisible();
    await quiet01(page);
    await unstickHeader(page);

    // Personal Details: one field outstanding, and the page tints it.
    const personal = await settingsRow(page, 'Personal Details');
    await expect(personal.getByText('1 highlighted field is still missing.')).toBeVisible();
    await shot(page, '01.6', '02-personal-details-highlighted', { clip: personal });

    // My Bio counts separately, which is why the sidebar says two.
    const bio = await settingsRow(page, 'My Bio');
    await expect(bio.getByText('1 highlighted field is still missing.')).toBeVisible();
    await shot(page, '01.6', '03-my-bio-highlighted', { clip: bio });
  });
});
