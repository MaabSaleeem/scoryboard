// 12.12 - Choosing a format for a padel tournament, using Swiss.
//
// Padel's Format tab is a different screen from football's. Five formats rather
// than three, a Next button rather than Save, and a second step that asks about
// standings, scoring, players, rounds, courts and the gap between rounds. A
// rules panel sits alongside, spelling out the format you picked.
//
// Nothing is saved. Choosing a format on the untouched fixture and pressing Next
// would generate its pairs and phases and stop it being untouched, so the
// "after" shot comes from the seeded "KB Padel Cup", which already carries a
// saved Swiss format.

import { test, expect } from '@playwright/test';
import { signIn, quiet, shot, fixtures, headerIdentity, centre, onScreen } from '../../lib/kb';

test.describe('12.12 Choosing a padel format', () => {
  test('the five formats, and configuring Swiss', async ({ page }) => {
    const fx = await fixtures('organiser');

    await signIn(page, 'organiser', `/tournaments/${fx.newPadelCup}/format`);
    await quiet(page);
    await expect(page.getByText('Choose a format', { exact: true })).toBeVisible();
    // All five, so the shot cannot be taken while the list is still filling in.
    for (const f of ['Swiss', 'Americano', 'Mexicano', 'King of the Court', 'Round Robin']) {
      await expect(page.getByText(f, { exact: true }).first()).toBeVisible();
    }
    await shot(page, '12.12', '01-five-padel-formats', { mask: [headerIdentity(page)] });

    const swiss = page.getByRole('button').filter({ hasText: 'Fixed pairs play rounds' }).first();
    await swiss.click();
    // The configuration step only exists once a format is chosen.
    await expect(onScreen(page.getByText('Standings type', { exact: true })).first()).toBeVisible();
    await shot(page, '12.12', '02-swiss-selected', {
      mask: [headerIdentity(page)],
      annotate: swiss,
    });

    const standings = onScreen(page.getByText('Standings type', { exact: true })).first();
    await centre(standings);
    await shot(page, '12.12', '03-standings-type', {
      mask: [headerIdentity(page)],
      annotate: standings,
    });

    const scoring = onScreen(page.getByText('Scoring *', { exact: true })).first();
    await centre(scoring);
    await shot(page, '12.12', '04-scoring', {
      mask: [headerIdentity(page)],
      annotate: scoring,
    });

    // How many players. The list is portalled; centre the trigger before opening
    // it, or the options are positioned against a trigger that then moves.
    const players = onScreen(
      page.locator('[role="combobox"]').filter({ hasText: 'Select players' }),
    ).first();
    await centre(players);
    await players.click();
    // Wait for the list itself, then pick from inside it. Asserting on a bare
    // option races the popover open and the page renders a second, hidden copy
    // of this field, so an unscoped option match is ambiguous as well as early.
    // Pick the listbox by what is in it: other pickers on this page leave their
    // own listboxes mounted, so first-in-DOM is not reliably this one.
    const playerList = onScreen(
      page.getByRole('listbox').filter({ hasText: '8 players' }),
    ).first();
    await expect(playerList).toBeVisible();
    const eightPlayers = playerList.getByText('8 players', { exact: true });
    await expect(eightPlayers).toBeVisible();
    await shot(page, '12.12', '05-how-many-players', { mask: [headerIdentity(page)] });
    // dispatchEvent, not click(). A real mouse sequence opens and closes this
    // option without selecting it; the component acts on a plain click event.
    await eightPlayers.dispatchEvent('click');
    // Re-locate rather than reuse `players`: that locator is defined by the
    // placeholder text, which the selection has just replaced.
    await expect(
      onScreen(page.locator('[role="combobox"]').filter({ hasText: '8 players' })).first(),
    ).toBeVisible();

    const rounds = page.locator('input[name="padelRoundCount"]:visible');
    await centre(rounds);
    await shot(page, '12.12', '06-rounds-courts-and-gap', {
      mask: [headerIdentity(page)],
      annotate: rounds,
    });

    const rules = onScreen(page.getByText(/rules and regulations/i)).first();
    await centre(rules);
    await shot(page, '12.12', '07-rules-and-regulations', { mask: [headerIdentity(page)] });

    // Deliberately not saved. The saved result comes from the configured fixture.
    await page.goto(`/tournaments/${fx.padelCup}/format`);
    await quiet(page);
    await expect(page.getByText(/group phase/i).first()).toBeVisible();
    await expect(page.getByText('Player 1 & Player 2', { exact: true })).toBeVisible();
    await shot(page, '12.12', '08-swiss-saved-pairs-and-phases', {
      mask: [headerIdentity(page)],
    });
  });
});
