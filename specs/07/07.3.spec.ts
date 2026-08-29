// 07.3 - Your team crest, banner and bio.
//
// The PROFILE APPEARANCE and TEAM INFORMATION cards on a team's Edit Team page.
//
// The three controls share collection 02's helpers: the file inputs carry the
// same `aria-label="Upload banner image"` / `"Upload avatar image"` as the ones
// on Profile settings, and the croppers are the same overlays with no
// `role="dialog"`.
//
// **This spec restores what it changes.** It opens the banner cropper on KB 07
// United, which is the crest and banner six other articles photograph. The
// cropper is cancelled rather than applied, so nothing is written - but the file
// input is set on the way, and cancelling is what keeps the fixture identical.
//
// Checked during exploration and NOT warned about in the article: a crest-only
// `PUT /teams/:id` does not clear the team bio. The defect collection 02 found on
// Profile settings, where saving a photo wipes your bio, has no equivalent here.

import { test, expect } from '@playwright/test';
import {
  shot, quiet07, signInAs, unstickHeader, onScreen, centre,
  fixtures07, teamCard, appearanceCard, imageEditControl, cropper,
  sidebarIdentity, notificationBadge,
  KB07, KB07_PROFILES, KB07_TEAMS, KB07_IMAGES, KB07_BIO,
} from '../../lib/kb';

test.describe('07.3 Your team crest, banner and bio', () => {
  test('the appearance card, the cropper and the bio', async ({ page }) => {
    const fx = await fixtures07();

    await signInAs(page, KB07.pro, `/teams/${fx.teams.united}/settings`);
    await quiet07(page);
    await expect(page.getByText(`Edit Team - ${KB07_TEAMS.united}`)).toBeVisible();
    await unstickHeader(page);
    // Only the viewport shot needs these: the four clipped ones never have the
    // sidebar in frame.
    const masks = [
      sidebarIdentity(page, `${KB07_PROFILES.pro.name} ${KB07_PROFILES.pro.lastName}`),
      notificationBadge(page),
    ];

    // 01 - the whole card: the banner across the top, the crest sitting on it,
    // and an edit/delete pair on each.
    const card = await appearanceCard(page);
    await shot(page, '07.3', '01-profile-appearance', { clip: card });

    // 02 - the banner's own controls. Neither is a button: each is a bare div
    // holding an svg, so they are reached through the bordered bar they sit in.
    const bannerEdit = imageEditControl(page, 'banner');
    await expect(bannerEdit).toBeVisible();
    await shot(page, '07.3', '02-banner-controls', {
      clip: card, annotate: bannerEdit.locator('xpath=..'),
    });

    // 03 - the cropper. Setting the file input opens it; it is NOT a dialog, so
    // openDialog() never finds it. Captured as a viewport because the overlay
    // covers the page and a clip to it alone loses the dimmed context.
    //
    // The PNG is handed over on purpose: the page says "JPG, GIF or PNG" and its
    // cropper re-encodes to WebP before uploading. The API takes WebP only.
    await page.locator('input[aria-label="Upload banner image"]').setInputFiles(KB07_IMAGES.bannerPng);
    const crop = await cropper(page, 'Crop Banner');
    await expect(crop.getByRole('button', { name: 'Apply & Upload' })).toBeVisible();
    await shot(page, '07.3', '03-crop-banner', { mask: masks });

    // Cancelled, not applied. The crest and banner other articles photograph are
    // the seed's, and a re-crop here would change them by run order.
    await crop.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.getByText('Crop Banner', { exact: true })).toHaveCount(0);

    // 04 - the bio, with its own character counter. Clipped to the whole TEAM
    // INFORMATION card rather than the Bio row: Discard and Save Changes belong
    // to the form, not to the row, so a clip to the row would put the next
    // shot's annotation outside the frame. Collection 02 made the same call.
    const info = await teamCard(page, 'TEAM INFORMATION');
    const bio = info.locator('textarea[name="bio"]');
    await expect(bio).toHaveValue(KB07_BIO);
    await centre(info);
    await shot(page, '07.3', '04-team-bio', { clip: info, annotate: bio });

    // 05 - and the button that stores all three.
    const save = info.getByRole('button', { name: 'Save Changes', exact: true });
    await shot(page, '07.3', '05-save-changes', { clip: info, annotate: save });
  });
});
