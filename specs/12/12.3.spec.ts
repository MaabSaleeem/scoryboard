// 12.3 - Dates, kick-off time, venues and teams.
//
// The map calls this "Step 1". This build has no numbered wizard: the date,
// kick-off time and venue live in the Create Tournament modal, and teams are
// added afterwards on the board. The article documents that order. See
// briefs/12.md, open question 2.
//
// Creates one throwaway venue named "KB 12 Scratch Pitch" so the empty picker and
// the create-a-venue form are both capturable, then deletes it again, so a second
// run starts from the same place.

import { test, expect } from '@playwright/test';
import { signIn, quiet, shot, fixtures, headerIdentity, asUser, freezeClock, tournamentListReady } from '../../lib/kb';

const SCRATCH = 'KB 12 Scratch Pitch';

test.describe('12.3 Dates, kick-off time, venues and teams', () => {
  test.afterEach(async () => {
    // Remove the scratch venue however the test ended, so the picker holds the
    // two seeded venues and nothing else on the next run.
    const fx = await fixtures('organiser');
    const list = (await asUser(fx.token, '/club-locations?tournamentSelectionOnly=true')).body.data ?? [];
    for (const v of list.filter((x: any) => x.name === SCRATCH)) {
      await asUser(fx.token, `/club-locations/${v.id}`, { method: 'DELETE' });
    }
  });

  test('when it starts and where it is played', async ({ page }) => {
    const fx = await fixtures('organiser');

    await signIn(page, 'organiser', '/tournaments');
    await freezeClock(page);
    await quiet(page);
    await tournamentListReady(page);
    await page.getByRole('button', { name: 'New Tournament' }).first().click();

    const modal = page.getByRole('dialog').filter({ hasText: 'Create Tournament' });
    await expect(modal).toBeVisible();
    await modal.getByPlaceholder('Name your tournament').fill('Sunday Five-a-side');

    // The date and time triggers have no accessible name; match them on the
    // value they currently show.
    // The club field's label flips from "Create club location" to "Create or
    // Select Clubs" once the saved-venue list arrives. Capture before that and
    // two runs of the same spec disagree, so wait for the settled label.
    await expect(modal.getByText(/create or select clubs/i)).toBeVisible();

    const startDate = modal.getByRole('button').filter({ hasText: /^\d{2}-\d{2}-\d{4}$/ });
    await shot(page, '12.3', '01-start-date-field', { clip: modal, annotate: startDate });

    await startDate.click();
    await shot(page, '12.3', '02-start-date-picker-open', { clip: modal });
    await page.keyboard.press('Escape');

    await modal.getByRole('button').filter({ hasText: 'Select time' }).click();
    await shot(page, '12.3', '03-kick-off-time-picker', { clip: modal });
    await page.getByRole('button', { name: 'Hour 10' }).click();
    await page.getByRole('button', { name: 'Minute 00' }).click();
    await page.getByRole('button', { name: 'Period AM' }).click();

    // The venue picker. It is a popover, so it is captured with a full-page
    // screenshot: clipping to it scrolls it into view, and the scroll dismisses
    // it, which leaves every following step waiting on an element that is gone.
    await modal.getByText('Select your club').click();
    const picker = page.getByRole('dialog').filter({ hasText: 'Location Club' });
    await expect(picker.getByRole('option', { name: /KB 12 Astro Park/ })).toBeVisible();
    // Full page rather than clipped to the popover, so mask the signed-in name
    // the way every other page shot in this collection does.
    await shot(page, '12.3', '04-venue-picker-saved-venues', {
      mask: [headerIdentity(page)],
    });

    // Adding a venue from inside the picker.
    // The add-a-venue control is an icon-only div with no accessible name. The
    // rounded-full class is what distinguishes it from the option rows - the one
    // place in this collection where a spec has to lean on styling.
    // dispatchEvent, not click(). The control is a bare div inside a Radix
    // popover; a real mouse click there dismisses the popover before its own
    // handler runs, and the form never opens. Dispatching the event directly on
    // the element is deterministic and does the same thing the app listens for.
    await picker.locator('div.rounded-full.cursor-pointer').dispatchEvent('click');
    // Match the add-venue form by a field it owns rather than by its accessible
    // name: it is portalled behind the picker popover, and the surrounding
    // aria-hidden makes getByRole('dialog') unreliable there.
    const venueForm = page.locator('div[role="dialog"]:has(input[name="clubName"])');
    await expect(venueForm.locator('input[name="clubName"]')).toBeVisible();
    await shot(page, '12.3', '05-add-venue-form-blank', { clip: venueForm });

    await venueForm.locator('input[name="clubName"]').fill(SCRATCH);
    await venueForm.locator('input[name="clubAddress"]').fill('Deptford, London');
    await shot(page, '12.3', '06-add-venue-form-filled', {
      clip: venueForm,
      annotate: venueForm.getByRole('button', { name: 'Continue' }),
    });
    await venueForm.getByRole('button', { name: 'Continue' }).click();
    await expect(modal.getByText(SCRATCH).first()).toBeVisible();

    // Teams are not part of this screen. They are added on the board afterwards.
    await modal.getByRole('button', { name: 'Close' }).click();
    await page.goto(`/tournaments/${fx.newCup}/participants`);
    await quiet(page);
    const addTeam = page.getByRole('button', { name: 'Add Team' });
    await addTeam.waitFor();
    // Wait for the empty state itself, not just the button: the panel renders in
    // two passes and the first one is short.
    await expect(page.getByText('No teams added yet', { exact: true })).toBeVisible();
    await shot(page, '12.3', '07-teams-are-added-on-the-board', {
      mask: [headerIdentity(page)],
      annotate: addTeam,
    });
  });
});
