// 12.11 - Creating a padel tournament.
//
// The Create Tournament form is the same one Football uses until you change the
// game type. Choosing Padel adds three fields Football never shows: Play mode,
// Enrollment type, and a Friendly Tournament toggle. Other Sports adds nothing -
// its form is byte-for-byte Football's.
//
// The modal is filled in but NEVER submitted. Every tournament created burns one
// of the organiser's free Tournament Pro slots and the slot cannot be given
// back. The final shot - the board you land on - comes from the seeded
// "KB New Padel Cup", which is exactly a padel tournament one second after the
// modal closes.

import { test, expect } from '@playwright/test';
import { signIn, quiet, shot, fixtures, headerIdentity, freezeClock, onScreen, tournamentListReady } from '../../lib/kb';

test.describe('12.11 Creating a padel tournament', () => {
  test('the game type, and the three fields it adds', async ({ page }) => {
    const fx = await fixtures('organiser');

    await signIn(page, 'organiser', '/tournaments');
    await freezeClock(page);
    await quiet(page);
    await tournamentListReady(page);
    await page.getByRole('button', { name: 'New Tournament' }).first().click();

    const modal = page.getByRole('dialog').filter({ hasText: 'Create Tournament' });
    await expect(modal).toBeVisible();
    // Wait for the saved-venue list, or the club field's label changes under us.
    await expect(modal.getByText(/create or select clubs/i)).toBeVisible();
    await modal.getByPlaceholder('Name your tournament').fill('Thursday Doubles');

    const gameType = modal.getByRole('button').filter({ hasText: 'Football' });
    await shot(page, '12.11', '01-game-type-on-a-new-tournament', {
      clip: modal,
      annotate: gameType,
    });

    await gameType.click();
    await expect(page.getByRole('option', { name: 'Padel', exact: true })).toBeVisible();
    // Full page, because the option list is portalled outside the modal. That
    // puts the sidebar in frame, so mask the signed-in name.
    await shot(page, '12.11', '02-the-three-game-types', { mask: [headerIdentity(page)] });

    await page.getByRole('option', { name: 'Padel', exact: true }).click();
    // Play mode and Enrollment type only exist for Padel, so their presence is
    // the assertion that the game type actually changed.
    // Match the labels exactly: a loose match also hits the field's own value or
    // placeholder, and these screens render each field twice for the two layouts.
    await expect(onScreen(modal.getByText('Play mode *', { exact: true })).first()).toBeVisible();
    await expect(onScreen(modal.getByText('Enrollment type *', { exact: true })).first()).toBeVisible();
    await shot(page, '12.11', '03-the-padel-form', { clip: modal });

    // Play mode. The options are portalled, so capture the page, not the modal.
    await modal.getByRole('button').filter({ hasText: 'Play for score' }).click();
    await expect(page.getByRole('option', { name: 'Play for time' })).toBeVisible();
    await shot(page, '12.11', '04-play-mode-options', { mask: [headerIdentity(page)] });
    await page.getByRole('option', { name: 'Play for score' }).click();

    // Enrollment type.
    await modal.getByRole('button').filter({ hasText: 'Select enrollment type' }).click();
    await expect(page.getByRole('option', { name: 'Doubles' })).toBeVisible();
    await shot(page, '12.11', '05-enrollment-type-options', { mask: [headerIdentity(page)] });
    await page.getByRole('option', { name: 'Doubles' }).click();
    await expect(onScreen(modal.getByText('Doubles', { exact: true })).first()).toBeVisible();

    // Close the option list before capturing: left open it covers the field this
    // shot is about. Then scroll the toggle into the modal's own viewport, or the
    // annotation is drawn below the clipped area and never appears.
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toBeHidden();
    const friendly = onScreen(modal.getByText('Friendly Tournament')).first();
    await friendly.scrollIntoViewIfNeeded();
    await expect(friendly).toBeInViewport();
    await shot(page, '12.11', '06-friendly-tournament', {
      clip: modal,
      annotate: friendly,
    });

    // Deliberately not submitted. The board a new padel tournament opens on
    // comes from the seeded untouched fixture.
    await modal.getByRole('button', { name: 'Close' }).click();
    await page.goto(`/tournaments/${fx.newPadelCup}/participants`);
    await quiet(page);
    await expect(page.getByText('No teams added yet', { exact: true })).toBeVisible();
    await shot(page, '12.11', '07-board-you-land-on', { mask: [headerIdentity(page)] });
  });
});
