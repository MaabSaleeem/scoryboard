// 22.1 - Venues - adding, finding, editing and logos
//
// Seven captures. Read `briefs/22.md`, "22.1", with this.
//
// Mo is the reader: Pro, holding two ordinary venues and one saved tournament
// venue. The article is a tour of the Locations list on Profile settings - add,
// edit, logo, remove - with one detour to the match form, which is where a
// venue is looked up.
//
// --- Preconditions --------------------------------------------------------
//
// `node scripts/seed-22.mjs` must have run. It guarantees Mo's three venues and
// sweeps any other venue off the account, because the Locations list and the
// match form's venue list both show everything the account holds.
//
// --- What this spec creates -----------------------------------------------
//
// One venue, KB 22 Scratch Pitch. The first test adds it through the form, the
// last test gives it a logo, edits it and removes it through the menu, and
// `afterAll` deletes it over the API however the run ended. Nothing persistent
// changes: a logo cannot be taken off a venue once set (the API refuses a null
// or empty avatarToken), which is why the logo goes on the scratch venue and
// not on a fixture.
//
// --- The clock ------------------------------------------------------------
//
// Not frozen. Nothing on these screens shows a date or a countdown.

import { test, expect } from '@playwright/test';
import path from 'node:path';
import {
  KB22, KB22_VENUES, KB22_SAVED_VENUE, KB22_SCRATCH, KB22_LOGO,
  fixtures22, dropScratch22, context22, open22, locationsRow22, addLocation22,
  venueRow22, venueRowMenu22, clubForm22, cropper22, unionBox, clearUnionBox,
  onScreen, shot, asUser, type Fx22,
} from '../../lib/kb';

const ARTICLE = '22.1';

let fx: Fx22;

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  fx = await fixtures22();
  // A run that died halfway leaves the scratch venue behind; start clean.
  await dropScratch22(fx.owner.token);
});

test.afterAll(async () => {
  if (fx) await dropScratch22(fx.owner.token);
});

/** Open Profile settings and wait for the Locations list to have loaded its rows. */
async function openLocations(page: import('@playwright/test').Page) {
  const heading = page.getByRole('heading', { name: 'Locations', exact: true });
  await open22(page, '/profile-settings', heading);
  // The list paints three grey skeleton rows until both venue fetches land.
  // Wait for a row that is always there, then for the skeletons to be gone.
  await expect(onScreen(page.getByText(KB22_VENUES.astro.name, { exact: true })).first()).toBeVisible();
  await expect(page.locator('.animate-pulse:visible')).toHaveCount(0);
  await heading.scrollIntoViewIfNeeded();
}

test('01-03 - add a venue from Profile settings', async ({ browser }) => {
  const { ctx, page } = await context22(browser, KB22.owner);
  await openLocations(page);

  // The three fixtures, and only those: the seed swept everything else, and
  // the saved tournament venue carries its pink badge here.
  const row = locationsRow22(page);
  await expect(row.getByText(KB22_VENUES.park.name, { exact: true })).toBeVisible();
  await expect(venueRow22(page, KB22_SAVED_VENUE.name).getByText('Saved', { exact: true })).toBeVisible();
  await expect(venueRow22(page, KB22_VENUES.astro.name).getByText('Saved', { exact: true })).toHaveCount(0);
  await expect(row.getByText(KB22_SCRATCH.name, { exact: true })).toHaveCount(0);
  await shot(page, ARTICLE, '01-profile-settings-locations', {
    clip: row,
    clipPad: 16,
    annotate: addLocation22(page),
  });

  // 02 - the form, blank. Continue is disabled until both fields are filled.
  await addLocation22(page).click();
  const form = clubForm22(page);
  await expect(form.getByText('Add new club location', { exact: true })).toBeVisible();
  await expect(form.getByText('Upload Club Logo', { exact: true })).toBeVisible();
  await expect(form.getByRole('button', { name: 'Continue', exact: true })).toBeDisabled();
  // No "Save for future tournaments" here - that box belongs to the tournament
  // forms (22.2). Asserted, because the article says so.
  await expect(form.getByText('Save for future tournaments')).toHaveCount(0);
  await shot(page, ARTICLE, '02-add-club-location-blank', { clip: form, clipPad: 12 });

  // 03 - filled in.
  await form.getByPlaceholder('Enter your club name').fill(KB22_SCRATCH.name);
  await form.getByPlaceholder('Enter your club location').fill(KB22_SCRATCH.location);
  const cont = form.getByRole('button', { name: 'Continue', exact: true });
  await expect(cont).toBeEnabled();
  await shot(page, ARTICLE, '03-add-club-location-filled', { clip: form, clipPad: 12, annotate: cont });

  await cont.click();
  await expect(form).toHaveCount(0);
  await expect(venueRow22(page, KB22_SCRATCH.name)).toBeVisible();
  await expect(venueRow22(page, KB22_SCRATCH.name).getByText(KB22_SCRATCH.location, { exact: true })).toBeVisible();
  // It went in as an ordinary venue: in the plain list, not the saved one.
  const plain = (await asUser(fx.owner.token, '/club-locations')).body?.data ?? [];
  const made = plain.find((v: any) => v.name === KB22_SCRATCH.name);
  expect(made, 'the scratch venue should be in GET /club-locations').toBeTruthy();
  await ctx.close();
});

test('04 - find a venue on the match form', async ({ browser }) => {
  const { ctx, page } = await context22(browser, KB22.owner);
  const club = page.getByPlaceholder('Search...');
  await open22(page, '/match/create', club);
  await expect(page.getByText('Location Club *', { exact: true })).toBeVisible();

  // The list opens on a click and holds the account's ordinary venues, with
  // "Create club location" at the top. The saved tournament venue is NOT here -
  // the two lists are disjoint (config/api.md, "Venues").
  await club.click();
  const popover = page.getByRole('dialog').filter({ hasText: 'Create club location' });
  await expect(popover).toBeVisible();
  const option = (name: string) => popover.getByRole('option', { name: new RegExp(name) });
  await expect(option(KB22_VENUES.astro.name)).toBeVisible();
  await expect(option(KB22_VENUES.park.name)).toBeVisible();
  await expect(option(KB22_SCRATCH.name)).toBeVisible();
  await expect(popover.getByText(KB22_SAVED_VENUE.name)).toHaveCount(0);
  await expect(popover.getByText('Create club location', { exact: true })).toBeVisible();

  // The popover opens upwards over the form, so the capture is the popover
  // plus the box it belongs to, framed together.
  const box = await unionBox(page, [popover, club], 16);
  await shot(page, ARTICLE, '04-match-form-location-club-list', {
    clip: box,
    annotate: option(KB22_SCRATCH.name),
  });
  await clearUnionBox(page);
  await page.keyboard.press('Escape');
  await ctx.close();
});

test('05-07 - edit a venue, give it a logo, remove it', async ({ browser }) => {
  const { ctx, page } = await context22(browser, KB22.owner);
  await openLocations(page);
  await expect(venueRow22(page, KB22_SCRATCH.name)).toBeVisible();

  // 05 - the row menu: Edit and Remove.
  await venueRowMenu22(page, KB22_SCRATCH.name).click();
  const menu = page.getByRole('menu');
  await expect(menu.getByRole('menuitem', { name: 'Edit', exact: true })).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Remove', exact: true })).toBeVisible();
  const box = await unionBox(page, [venueRow22(page, KB22_SCRATCH.name), menu], 16);
  await shot(page, ARTICLE, '05-location-menu-edit-remove', { clip: box, annotate: menu });
  await clearUnionBox(page);

  // 06 - Edit, then Upload Club Logo. Choosing a file opens the round cropper
  // over the form.
  await menu.getByRole('menuitem', { name: 'Edit', exact: true }).click();
  const form = clubForm22(page);
  await expect(form.getByText('Edit club location', { exact: true })).toBeVisible();
  await expect(form.getByPlaceholder('Enter your club name')).toHaveValue(KB22_SCRATCH.name);
  const chooser = page.waitForEvent('filechooser');
  await form.getByText('Upload Club Logo', { exact: true }).click();
  await (await chooser).setFiles(path.resolve(KB22_LOGO));
  const cropper = cropper22(page);
  await expect(cropper.getByText('Scroll to zoom and drag to position', { exact: true })).toBeVisible();
  await expect(cropper.getByRole('slider', { name: 'Zoom level' })).toBeVisible();
  const apply = cropper.getByRole('button', { name: 'Apply', exact: true });
  await expect(apply).toBeVisible();
  await shot(page, ARTICLE, '06-edit-club-location-logo-cropper', { clip: cropper, clipPad: 16, annotate: apply });

  // Apply puts the cropped logo in the form; Continue saves it with the edit.
  await apply.click();
  await expect(cropper).toHaveCount(0);
  await expect(form.getByRole('img', { name: 'User avatar' })).toBeVisible();
  const location = form.getByPlaceholder('Enter your club location');
  await location.fill(KB22_SCRATCH.editedLocation);
  await form.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(form).toHaveCount(0);

  // 07 - the row again: new address, and the logo where the initials were.
  const row = venueRow22(page, KB22_SCRATCH.name);
  await expect(row.getByText(KB22_SCRATCH.editedLocation, { exact: true })).toBeVisible();
  await expect(row.locator('img')).toBeVisible();
  const saved = (await asUser(fx.owner.token, '/club-locations')).body?.data ?? [];
  const mine = saved.find((v: any) => v.name === KB22_SCRATCH.name);
  expect(mine?.avatarVersion, 'the venue should carry an avatarVersion now').toBeTruthy();
  expect(mine?.location).toBe(KB22_SCRATCH.editedLocation);
  await shot(page, ARTICLE, '07-location-edited-with-logo', {
    clip: locationsRow22(page),
    clipPad: 16,
    annotate: row,
  });

  // Remove: one click, no confirmation, and the row is gone. The article says
  // exactly that, so it is asserted - a confirmation dialog appearing here is a
  // product change the article would have to follow.
  await venueRowMenu22(page, KB22_SCRATCH.name).click();
  await page.getByRole('menu').getByRole('menuitem', { name: 'Remove', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(venueRow22(page, KB22_SCRATCH.name)).toHaveCount(0, { timeout: 30_000 });
  const after = (await asUser(fx.owner.token, '/club-locations')).body?.data ?? [];
  expect(after.some((v: any) => v.name === KB22_SCRATCH.name)).toBe(false);
  await ctx.close();
});
