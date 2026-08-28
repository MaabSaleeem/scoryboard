// 12.2 - Creating a tournament, and what you land on.
//
// The Create Tournament modal is filled in but NEVER submitted. Every tournament
// created consumes one of the organiser's free Tournament Pro slots, and the slot
// cannot be given back (there is no revoke endpoint). The final shot - the board
// you land on - comes from the seeded "KB New Cup", which is exactly a tournament
// one second after the modal closes.
//
// Role: only the signed-in creator sees this. There is no role variation to show.

import { test, expect } from '@playwright/test';
import { signIn, quiet, shot, fixtures, headerIdentity, freezeClock } from '../../lib/kb';

test.describe('12.2 Creating a tournament', () => {
  test('the Create Tournament modal, field by field', async ({ page }) => {
    const fx = await fixtures('organiser');

    await signIn(page, 'organiser', '/tournaments');
    await freezeClock(page);
    await quiet(page);
    await page.getByText('Your Tournaments (2)', { exact: true }).waitFor();

    const newButton = page.getByRole('button', { name: 'New Tournament' }).first();
    await shot(page, '12.2', '01-tournament-list', {
      mask: [headerIdentity(page)],
      annotate: newButton,
    });

    await newButton.click();
    const modal = page.getByRole('dialog').filter({ hasText: 'Create Tournament' });
    await expect(modal).toBeVisible();
    // The club field's label starts as "Create club location" and becomes
    // "Create or Select Clubs" when the saved-venue list arrives. Wait for the
    // settled label, or the modal shots in this spec disagree with each other.
    await expect(modal.getByText(/create or select clubs/i)).toBeVisible();
    await shot(page, '12.2', '02-create-modal-blank', { clip: modal });

    const name = modal.getByPlaceholder('Name your tournament');
    await name.fill('Sunday Five-a-side');
    await shot(page, '12.2', '03-create-modal-named', { clip: modal, annotate: name });

    // Start date. The default is today, which would change every run, so the
    // picker is opened rather than a value chosen. The trigger has no accessible
    // name - it is matched by the date it currently shows.
    await modal.getByRole('button').filter({ hasText: /^\d{2}-\d{2}-\d{4}$/ }).click();
    await shot(page, '12.2', '04-start-date-picker', { clip: modal });
    await page.keyboard.press('Escape');

    // Kick-off time. The cells carry accessible names - "Hour 10", "Minute 00",
    // "Period AM" - which is what makes this reproducible.
    await modal.getByRole('button').filter({ hasText: 'Select time' }).click();
    await page.getByRole('button', { name: 'Hour 10' }).click();
    await page.getByRole('button', { name: 'Minute 00' }).click();
    await page.getByRole('button', { name: 'Period AM' }).click();
    await expect(modal.getByText('10:00 AM')).toBeVisible();
    await shot(page, '12.2', '05-start-time-chosen', { clip: modal });

    // Match duration, in minutes.
    const duration = modal.locator('input[name="duration"]');
    await duration.fill('10');
    await shot(page, '12.2', '06-match-duration', { clip: modal, annotate: duration });

    // Venue. At least one is required; the picker lists only saved tournament venues.
    const clubTrigger = modal.getByText('Select your club');
    await clubTrigger.click();
    await page.getByRole('option', { name: /KB 12 Astro Park/ }).click();

    // Close the venue popover before capturing. Left open it covers the fields
    // above it, and the shot reads as a half-finished selection rather than a
    // completed form.
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog').filter({ hasText: 'Location Club' })).toBeHidden();

    // The modal scrolls internally and Create sits below its fold, so scroll it
    // into view - otherwise the annotation is drawn outside the captured area.
    const createButton = modal.getByRole('button', { name: 'Create' });
    await createButton.scrollIntoViewIfNeeded();
    await expect(createButton).toBeInViewport();
    await shot(page, '12.2', '07-create-modal-complete', {
      clip: modal,
      annotate: createButton,
    });

    // Deliberately not submitted. Close, and show the board a new tournament
    // opens on, using the seeded untouched fixture.
    await modal.getByRole('button', { name: 'Close' }).click();
    await page.goto(`/tournaments/${fx.newCup}/participants`);
    await quiet(page);
    await page.getByText('No teams added yet', { exact: true }).waitFor();
    await shot(page, '12.2', '08-board-you-land-on', { mask: [headerIdentity(page)] });
  });
});
