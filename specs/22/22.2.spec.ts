// 22.2 - Tournament-only venues and saving venues for reuse
//
// Four captures. Read `briefs/22.md`, "22.2", with this.
//
// Mo owns KB 22 Cup; Ana is its Admin. The tournament holds three venues: Mo's
// saved KB 22 Cup Ground (the one the tournament was created on), Mo's
// tournament-only KB 22 Overflow Pitch, and Ana's tournament-only KB 22 Admin
// Pitch. The article is about the difference between the first and the other
// two, and about who may touch which.
//
// --- Preconditions --------------------------------------------------------
//
// `node scripts/seed-22.mjs` must have run. It guarantees the tournament, the
// admin row and the three venues, and sweeps any other venue off both accounts.
//
// --- What this spec changes -----------------------------------------------
//
// Nothing. The first test fills the Create Tournament form and its venue form
// and then closes both; the last test attempts an edit the server refuses.
//
// --- The clock ------------------------------------------------------------
//
// Not frozen. The Create Tournament modal defaults Start date to today, and
// that field is inside the first capture's clip - the picker opens below it.
// Freezing the clock is what collection 12 did for the same modal; here it is
// not done, because the popover's own list and add form are the subject and
// today's date is incidental. Two runs on two days will differ in that one
// field, which docs/style-guide.md allows.

import { test, expect } from '@playwright/test';
import {
  KB22, KB22_SAVED_VENUE, KB22_ONE_OFF, KB22_SCRATCH, KB22_TOURNAMENT_DATE_SHOWN, KB22_CREATOR_ONLY,
  fixtures22, context22, open22, openTournamentClubPicker22, openPickerAddForm22, clubForm22,
  tournamentLocationCard22, addTournamentLocation22, venueRow22, venueRowMenu22,
  unionBox, clearUnionBox, shot, asUser, type Fx22,
} from '../../lib/kb';

const ARTICLE = '22.2';

let fx: Fx22;

test.beforeAll(async () => { fx = await fixtures22(); });

test('01-02 - saved venues in the Create Tournament picker, and the Save box', async ({ browser }) => {
  const { ctx, page } = await context22(browser, KB22.owner);
  await open22(page, '/tournaments', page.getByRole('button', { name: 'New Tournament' }).first());
  const { modal, picker } = await openTournamentClubPicker22(page);

  // The picker lists the saved tournament venues and nothing else: not the two
  // ordinary venues, not the tournament-only ones.
  const savedRow = picker.getByRole('option', { name: new RegExp(KB22_SAVED_VENUE.name) });
  await expect(savedRow).toBeVisible();
  await expect(savedRow.getByText('Saved', { exact: true })).toBeVisible();
  await expect(picker.getByText(KB22_ONE_OFF.owner.name)).toHaveCount(0);
  await expect(picker.getByText('KB 22 Astro')).toHaveCount(0);
  // The modal and the popover hanging off its club field, framed together.
  // Padding is 0: the modal fills the viewport top to bottom.
  const box = await unionBox(page, [modal, picker], 0);
  await shot(page, ARTICLE, '01-create-tournament-saved-venues', { clip: box, annotate: savedRow });
  await clearUnionBox(page);

  // 02 - the add form from the "+", with Save for future tournaments. Filled
  // in and ticked, then closed without Continue: nothing is created.
  const form = await openPickerAddForm22(picker, page);
  await expect(form.getByText('Add new club location', { exact: true })).toBeVisible();
  await form.getByPlaceholder('Enter your club name').fill(KB22_SCRATCH.name);
  await form.getByPlaceholder('Enter your club location').fill(KB22_SCRATCH.location);
  const save = form.getByRole('checkbox', { name: 'Save for future tournaments' });
  await expect(save).toHaveAttribute('aria-checked', 'false');
  await save.click();
  await expect(save).toHaveAttribute('aria-checked', 'true');
  await expect(form.getByText('Reuse this club location the next time you create a tournament.', { exact: true })).toBeVisible();
  // The box and its two lines of text sit in one grey panel; outline the panel.
  const panel = save.locator('xpath=ancestor::div[contains(@class,"rounded")][1]');
  await shot(page, ARTICLE, '02-add-club-location-save-for-future', { clip: form, clipPad: 12, annotate: panel });

  await form.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(form).toHaveCount(0);
  await modal.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(modal).toHaveCount(0);
  await ctx.close();
});

test('03 - every venue on the tournament, on its settings page', async ({ browser }) => {
  const { ctx, page } = await context22(browser, KB22.owner);
  const marker = page.getByText('All locations for the tournament', { exact: true });
  await open22(page, `/tournaments/${fx.tournament}/settings`, marker);
  await expect(page.getByRole('heading', { name: `Edit Tournament - KB 22 Cup` })).toBeVisible();
  await expect(page.getByRole('button', { name: KB22_TOURNAMENT_DATE_SHOWN, exact: true })).toBeVisible();

  const card = tournamentLocationCard22(page);
  // Three venues. Only the saved one carries the badge; the tournament-only
  // two do not, whoever added them.
  await expect(venueRow22(page, KB22_SAVED_VENUE.name).getByText('Saved', { exact: true })).toBeVisible();
  await expect(venueRow22(page, KB22_ONE_OFF.owner.name)).toBeVisible();
  await expect(venueRow22(page, KB22_ONE_OFF.owner.name).getByText('Saved', { exact: true })).toHaveCount(0);
  await expect(venueRow22(page, KB22_ONE_OFF.admin.name)).toBeVisible();
  await expect(venueRow22(page, KB22_ONE_OFF.admin.name).getByText('Saved', { exact: true })).toHaveCount(0);
  // The row menu here is Edit only - there is no Remove on a tournament's
  // venue. Asserted, because the article says so.
  await venueRowMenu22(page, KB22_ONE_OFF.owner.name).click();
  const menu = page.getByRole('menu');
  await expect(menu.getByRole('menuitem', { name: 'Edit', exact: true })).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Remove', exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  // Closing the menu hands focus back to the kebab, which paints a pale focus
  // ring that the first run published. Drop the focus before the capture.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await expect(venueRowMenu22(page, KB22_ONE_OFF.owner.name)).not.toBeFocused();

  await shot(page, ARTICLE, '03-tournament-settings-locations', {
    clip: card,
    clipPad: 8,
    annotate: addTournamentLocation22(page),
  });
  await ctx.close();
});

test('04 - an Admin can add a venue but cannot edit the Owner\'s', async ({ browser }) => {
  const { ctx, page } = await context22(browser, KB22.admin);
  const marker = page.getByText('All locations for the tournament', { exact: true });
  await open22(page, `/tournaments/${fx.tournament}/settings`, marker);

  // Ana sees the same card as Mo: the "+ Location" button and all three
  // venues, including the one she added herself.
  await expect(addTournamentLocation22(page)).toBeVisible();
  await expect(venueRow22(page, KB22_ONE_OFF.admin.name)).toBeVisible();

  // Editing Mo's venue is offered and then refused by the server. The message
  // is printed under the form.
  await venueRowMenu22(page, KB22_ONE_OFF.owner.name).click();
  await page.getByRole('menu').getByRole('menuitem', { name: 'Edit', exact: true }).click();
  const form = clubForm22(page);
  await expect(form.getByText('Edit Location', { exact: true })).toBeVisible();
  await expect(form.getByPlaceholder('Enter your club name')).toHaveValue(KB22_ONE_OFF.owner.name);
  await form.getByPlaceholder('Enter your club location').fill(`${KB22_ONE_OFF.owner.location} (edited)`);
  await form.getByRole('button', { name: 'Continue', exact: true }).click();
  const refusal = form.getByText(KB22_CREATOR_ONLY, { exact: true });
  await expect(refusal).toBeVisible();
  // Nothing changed on the server.
  const still = (await asUser(fx.owner.token, `/club-locations/${fx.overflow}`)).body?.data;
  expect(still?.location).toBe(KB22_ONE_OFF.owner.location);
  await shot(page, ARTICLE, '04-admin-cannot-edit-owners-venue', { clip: form, clipPad: 12, annotate: refusal });

  await form.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(form).toHaveCount(0);
  await ctx.close();
});
