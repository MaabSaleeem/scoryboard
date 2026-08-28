// 02.5 - Your profile photo, banner and bio.
//
// The only spec in this collection that changes the persona. It removes her photo
// and banner over the API, walks both uploads through the page, and ends with
// both in place - which is exactly the state scripts/seed-02.mjs leaves, so the
// other seven specs are unaffected whichever order they run in.
//
// Removing them at the start is also what clears a run that died halfway.
//
// The two images are assets/02/pia-avatar.png and assets/02/pia-banner.png,
// drawn from SVG by scripts/make-assets-02.mjs so a later session can rebuild
// identical bytes. Flat graphics, not a photograph: a real person's face is not
// something this project may put in a help article. Both are deliberately large -
// the Crop Banner dialog puts a yellow advisory over anything under 1728 x 672.
//
// The page takes the PNG; the API does not. POST /players/avatar answers 415
// "Unsupported file type" for a PNG and accepts only WebP, because the page's own
// cropper re-encodes in the browser before uploading. lib/api.mjs, upload().

import { test, expect } from '@playwright/test';
import {
  shot, quiet, blockPromos, signInAs, unstickHeader, asUser, upload,
  fixtures02, KB02, KB02_IMAGES, KB02_PROFILES,
  appearanceCard, bannerPanel, imageEditControl, cropper, settingsRow,
} from '../../lib/kb';

test.describe('02.5 Your profile photo, banner and bio', () => {
  test('adding a photo, adding a banner, and writing a bio', async ({ page }) => {
    const fx = await fixtures02();

    // Start from no images of her own, which is where a reader starts. Both
    // endpoints answer 200 whether or not there was anything to remove.
    for (const p of [`/players/${fx.player.playerId}/avatar`, `/players/${fx.player.playerId}/banner`]) {
      const r = await asUser(fx.player.token, p, { method: 'DELETE' });
      expect(r.status, `DELETE ${p}`).toBe(200);
    }

    await blockPromos(page);
    await signInAs(page, KB02.player, '/profile-settings');
    await expect(page.getByText(/^profile appearance$/i)).toBeVisible();
    await quiet(page);
    await unstickHeader(page);

    const card = await appearanceCard(page);
    const photoEdit = imageEditControl(page, 'avatar');
    const bannerEdit = imageEditControl(page, 'banner');

    // 01 - with nothing of your own, the banner falls back to the app's default
    // artwork and the photo to your initial.
    await expect(card.locator('img[alt="avatar"]')).toHaveCount(0);
    await shot(page, '02.5', '01-appearance-no-images', {
      clip: card, annotate: photoEdit, annotatePad: 2,
    });

    // 02 - choosing a photo opens the cropper. Setting the file input is what a
    // reader does with the file picker; the picker itself is the operating
    // system's and cannot be photographed.
    await page.locator('input[aria-label="Upload avatar image"]').setInputFiles(KB02_IMAGES.avatarPng);
    const avatarCropper = await cropper(page, 'Edit Your Avatar');
    await expect(avatarCropper.getByRole('button', { name: 'Apply', exact: true })).toBeVisible();
    await shot(page, '02.5', '02-crop-your-photo', { clip: avatarCropper });

    // 03 - Apply uploads it. Wait for the img to exist rather than for a
    // duration: the upload is two calls, POST /players/avatar then PUT /users.
    await avatarCropper.getByRole('button', { name: 'Apply', exact: true }).click();
    await expect(card.locator('img[alt="avatar"]')).toBeVisible();
    await shot(page, '02.5', '03-photo-in-place', { clip: card });

    // 04 - the banner has its own pair of controls, at the top right.
    await shot(page, '02.5', '04-banner-upload-control', {
      clip: card, annotate: bannerEdit, annotatePad: 2,
    });

    // 05 - the banner cropper is a different dialog with a different button.
    await page.locator('input[aria-label="Upload banner image"]').setInputFiles(KB02_IMAGES.bannerPng);
    const bannerCropper = await cropper(page, 'Crop Banner');
    await expect(bannerCropper.getByRole('button', { name: 'Apply & Upload', exact: true })).toBeVisible();
    await shot(page, '02.5', '05-crop-banner', { clip: bannerCropper });

    // 06 - both in place. The banner is a CSS background, not an img, so the
    // gate is the style attribute changing to a blob URL rather than an element
    // appearing.
    await bannerCropper.getByRole('button', { name: 'Apply & Upload', exact: true }).click();
    await expect(bannerPanel(page)).toHaveAttribute('style', /url\("blob:/);
    await shot(page, '02.5', '06-photo-and-banner-in-place', { clip: card });

    // 07 - the bio, typed here rather than found already in the box.
    //
    // It has to be typed, because uploading the photo emptied it. Observed on
    // staging 2026-08-29 and isolated: the page saves a new photo with
    // `PUT /users/:userId {"avatarToken": "..."}` and nothing else, and that PUT
    // is a full replace for optional fields - `bio` comes back "". Gender, date
    // of birth, sports and position survive because they are required and the
    // server keeps them. It is a real defect and 02.5 warns about it; the
    // article's order - photo, then banner, then bio - is chosen because of it.
    const bio = await settingsRow(page, 'My Bio');
    const box = bio.locator('textarea');
    await expect(box).toHaveValue('');
    await box.fill(KB02_PROFILES.player.bio);
    const count = bio.getByText(`${KB02_PROFILES.player.bio.length}/150`);
    await expect(count).toBeVisible();
    await shot(page, '02.5', '07-your-bio', { clip: bio, annotate: count });

    // Save it, the way the article's last step says to.
    await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
    await expect.poll(async () => {
      const me = (await asUser(fx.player.token, '/users/me')).body?.data;
      return me?.bio;
    }, { timeout: 30_000, intervals: [1000] }).toBe(KB02_PROFILES.player.bio);

    // Then put the two images back to the seed's own copies.
    //
    // The page's cropper does not upload the file it was given: its crop window
    // is a fixed box in the middle of the image, so what it stores is a zoomed
    // centre band. Leaving that in place would mean the persona's banner looked
    // one way in the articles captured before this spec and another way in the
    // articles captured after it, purely by run order. scripts/seed-02.mjs
    // uploads the whole image, so re-uploading here is what makes the collection
    // consistent whatever order the suite runs in.
    const avatar = await upload(fx.player.token, '/players/avatar', 'avatar', KB02_IMAGES.avatarWebp);
    expect(avatar.status, 'POST /players/avatar').toBe(200);
    const banner = await upload(
      fx.player.token, `/players/${fx.player.playerId}/banner`, 'banner', KB02_IMAGES.bannerWebp,
    );
    expect(banner.status, 'POST /players/:id/banner').toBe(200);
    const restored = await asUser(fx.player.token, `/users/${fx.player.id}`, {
      method: 'PUT',
      body: { ...KB02_PROFILES.player, avatarToken: avatar.body.data, bannerToken: banner.body.data },
    });
    expect(restored.status, 'PUT /users/:id').toBe(200);
  });
});
