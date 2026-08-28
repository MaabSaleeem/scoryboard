// 12.6 - Venues on a tournament.
//
// The map titles this "Venues, registration fees and referee fees". Neither fee
// exists in this build: there is no fee field on the create modal, on the format
// tab, or on the settings page, and the strings do not appear in the app bundle.
// The spec covers the venue half only. See briefs/12.md, open question 3.
//
// Creates one throwaway venue and removes it again, so the picker holds the two
// seeded venues on every run.

import { test, expect } from '@playwright/test';
import { signIn, quiet, shot, fixtures, headerIdentity, asUser, freezeClock, tournamentListReady } from '../../lib/kb';

const SCRATCH = 'KB 12 Scratch Pitch';

test.describe('12.6 Venues on a tournament', () => {
  test.afterEach(async () => {
    const fx = await fixtures('organiser');
    const list = (await asUser(fx.token, '/club-locations?tournamentSelectionOnly=true')).body.data ?? [];
    for (const v of list.filter((x: any) => x.name === SCRATCH)) {
      await asUser(fx.token, `/club-locations/${v.id}`, { method: 'DELETE' });
    }
  });

  test('choosing, saving and reviewing venues', async ({ page }) => {
    const fx = await fixtures('organiser');

    await signIn(page, 'organiser', '/tournaments');
    await freezeClock(page);
    await quiet(page);
    await tournamentListReady(page);
    await page.getByRole('button', { name: 'New Tournament' }).first().click();

    const modal = page.getByRole('dialog').filter({ hasText: 'Create Tournament' });
    await expect(modal).toBeVisible();
    // The club field's label flips from "Create club location" to "Create or
    // Select Clubs" once the saved-venue list arrives. Capture before that and
    // two runs of the same spec disagree, so wait for the settled label.
    await expect(modal.getByText(/create or select clubs/i)).toBeVisible();

    const clubField = modal.getByText('Select your club');
    await shot(page, '12.6', '01-a-venue-is-required', {
      clip: modal,
      annotate: clubField,
    });

    await clubField.click();
    const picker = page.getByRole('dialog').filter({ hasText: 'Location Club' });
    await expect(picker.getByRole('option', { name: /KB 12 Astro Park/ })).toBeVisible();
    // Full page, not clipped: clipping scrolls the popover into view and the
    // scroll dismisses it.
    // Full page rather than clipped to the popover, so mask the signed-in name
    // the way every other page shot in this collection does.
    await shot(page, '12.6', '02-venue-picker', { mask: [headerIdentity(page)] });

    // Icon-only div, no accessible name. rounded-full distinguishes the add
    // control from the option rows.
    // dispatchEvent, not click(). The control is a bare div inside a Radix
    // popover; a real mouse click there dismisses the popover before its own
    // handler runs, and the form never opens. Dispatching the event directly on
    // the element is deterministic and does the same thing the app listens for.
    await picker.locator('div.rounded-full.cursor-pointer').dispatchEvent('click');
    // Match the add-venue form by a field it owns rather than by its accessible
    // name: it is portalled behind the picker popover, and the surrounding
    // aria-hidden makes getByRole('dialog') unreliable there.
    const form = page.locator('div[role="dialog"]:has(input[name="clubName"])');
    await expect(form.locator('input[name="clubName"]')).toBeVisible();
    await form.locator('input[name="clubName"]').fill(SCRATCH);
    await form.locator('input[name="clubAddress"]').fill('Deptford, London');
    await shot(page, '12.6', '03-add-a-venue', { clip: form });

    // "Save for future tournaments" is what puts a venue in the picker next time.
    const saveForFuture = form.getByText('Save for future tournaments');
    await shot(page, '12.6', '04-save-for-future-tournaments', {
      clip: form,
      annotate: saveForFuture,
    });
    await form.getByRole('button', { name: 'Continue' }).click();
    await expect(modal.getByText(SCRATCH).first()).toBeVisible();
    await modal.getByRole('button', { name: 'Close' }).click();

    // Venues on an existing tournament live in the settings page's LOCATION block.
    await page.goto(`/tournaments/${fx.cup}/settings`);
    await quiet(page);
    await page.getByText('Edit Tournament - KB Cup').waitFor();
    const location = page.getByText(/all locations for the tournament/i);
    await location.scrollIntoViewIfNeeded();
    await shot(page, '12.6', '05-venues-in-tournament-settings', {
      mask: [headerIdentity(page)],
    });

    // And what a visitor sees of them.
    await page.goto(`/tournament/${fx.cup}/info`);
    await quiet(page);
    await page.getByText(/no\. of locations/i).first().waitFor();
    await shot(page, '12.6', '06-venues-on-the-public-page', {
      mask: [headerIdentity(page)],
    });
  });
});
