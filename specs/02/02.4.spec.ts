// 02.4 - Profile settings - what you can change.
//
// A tour of /profile-settings, section by section. Two of its sections belong to
// collection 01 and are deliberately not photographed here: the "Complete your
// profile" count is 01.6, and Delete account is 01.7.
//
// Reads only. Nothing is saved: the spec opens the page, clips each section and
// leaves. Discard is never needed because no field is touched.
//
// The page is about 2800px tall and nothing on it carries an id, so each section
// is clipped from its own heading - the same approach collection 01 took with
// settingsRow(). unstickHeader() first: the app header is position: sticky and
// paints itself over the top of a clipped capture.

import { test, expect } from '@playwright/test';
import {
  shot, quiet, blockPromos, signInAs, unstickHeader,
  fixtures02, KB02, KB02_PROFILES, KB02_TEAMS,
  appearanceCard, bannerPanel, settingsRow, settingsSection, openAccountBlock,
} from '../../lib/kb';

test.describe('02.4 Profile settings - what you can change', () => {
  test('appearance, personal details, bio, memberships and security', async ({ page }) => {
    await fixtures02();

    await blockPromos(page);
    await signInAs(page, KB02.player, '/');
    await quiet(page);

    // The article's first step is the sidebar route in, so walk it rather than
    // going straight to the URL.
    await openAccountBlock(page, 'Pia KB');
    await page.getByText('Edit User Profile', { exact: true }).last().click();
    await page.waitForURL('**/profile-settings*');
    await expect(page.getByText('Personal Details', { exact: true }).first()).toBeVisible();
    await quiet(page);
    await unstickHeader(page);

    // 01 - Profile appearance. The banner is annotated rather than the photo:
    // it is the half of the card a reader does not expect to be there, and it is
    // where collection 12 was caught out by an unlabelled image control.
    const appearance = await appearanceCard(page);
    await shot(page, '02.4', '01-profile-appearance', {
      clip: appearance, annotate: bannerPanel(page), annotatePad: -4,
    });

    // 02 - Personal details. Email is shown and cannot be changed here.
    const personal = await settingsRow(page, 'Personal Details');
    await expect(personal.locator('input[name="name"]')).toHaveValue(KB02_PROFILES.player.name);
    await shot(page, '02.4', '02-personal-details', { clip: personal });

    // 03 - My bio, and the Save Changes the article's last step names.
    //
    // Clipped to the whole Basic information card rather than to the My Bio row.
    // Discard and Save Changes sit under BOTH rows and belong to the form, not to
    // either row - there is no wrapper that holds My Bio and the buttons without
    // Personal Details as well. A clip to the row alone put the annotation
    // outside the capture, where only its top edge survived.
    const basic = await settingsSection(page, 'BASIC INFORMATION');
    await expect(basic.getByText('My Bio', { exact: true })).toBeVisible();
    await expect(basic.getByRole('button', { name: 'Discard', exact: true })).toBeVisible();
    const save = basic.getByRole('button', { name: 'Save Changes', exact: true });
    await shot(page, '02.4', '03-my-bio', { clip: basic, annotate: save });

    // 04 - Leaderboards, Teams and Locations. Read-only lists of what the
    // account belongs to. The whole section, because the article is about all
    // three rows and none of them means much alone.
    const memberships = await settingsSection(page, 'Leaderboards, Teams and Locations');
    await expect(memberships.getByText("Pia's leaderboard")).toBeVisible();
    await expect(memberships.getByText(KB02_TEAMS.home, { exact: true })).toBeVisible();
    await shot(page, '02.4', '04-leaderboards-teams-locations', { clip: memberships });

    // 05 - Security.
    const security = await settingsRow(page, 'Change Password');
    await shot(page, '02.4', '05-change-password', { clip: security });
  });
});
