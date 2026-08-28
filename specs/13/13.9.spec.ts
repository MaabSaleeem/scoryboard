// 13.9 - Setting and renaming bracket matches in a football tournament.
//
// Fixture: KB 13 Cup, whose group phase has NOT been played. That matters: the
// slot menu offers group positions - 1st Group A ... Bye - only while the
// feeding group is still undecided. On KB 13 Summer Cup, whose group phase is
// complete, the same menu lists the eight team names instead.
//
// This spec fills a slot, which is a real change. It clears Match C1 slot 1 over
// the API before it starts, so it always begins from an empty slot however the
// previous run left it. scripts/seed-13.mjs clears it again.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures13, headerIdentity, centre, onScreen, boardReady, asUser,
  boardText, matchCard, alignTop,
} from '../../lib/kb';

test.describe('13.9 Filling and renaming football bracket matches', () => {
  test('a position, a named team, and a new match title', async ({ page }) => {
    const fx = await fixtures13();
    const cup = await fx.detail(fx.cup);
    const bracket = cup.brackets[0];
    const matchC1 = bracket.matches.find((m: any) => m.name === 'Match C1');
    expect(matchC1, 'KB 13 Cup must have Match C1 - run node scripts/seed-13.mjs').toBeTruthy();

    // Own precondition: slot 1 empty, whatever the last run did.
    // PATCH .../participants {"homeTeamId":""} is how the app clears a slot.
    await asUser(
      fx.token,
      `/tournament-brackets/${bracket.id}/matches/${matchC1.tournamentMatchId}/participants`,
      { method: 'PATCH', body: { homeTeamId: '' } },
    );

    await signInAs(page, fx.email, `/tournaments/${fx.cup}/format`);
    await quiet(page);
    await boardReady(page, boardText(page, 'Match C1'));

    const card = await matchCard(page, 'Match C1');
    await centre(card);
    const addTeam = card.locator('[aria-label="Add team to slot 1"]').locator('visible=true').first();
    await expect(addTeam).toBeVisible();
    await shot(page, '13.9', '01-add-team-to-slot', {
      mask: [headerIdentity(page)],
      annotate: addTeam,
    });

    // The menu is nine items tall and opens downwards. Centred, its last three
    // options fall off the bottom of the viewport, so move the card up first.
    await alignTop(card);
    await addTeam.click();
    const menu = onScreen(page.locator('[role="menu"]')).first();
    // Positions, not team names - assert the far ends of the list so a partly
    // rendered menu cannot be captured.
    await expect(menu.getByText('1st Group A', { exact: true })).toBeVisible();
    await expect(menu.getByText('Bye', { exact: true })).toBeVisible();
    // All nine options are in the menu, but it has a fixed maximum height and
    // scrolls: six and a half are on screen at once. Assert they are all there
    // rather than all visible, and let the capture show the list as it renders.
    await expect(menu.getByRole('menuitem')).toHaveCount(9);
    await shot(page, '13.9', '02-position-menu', { mask: [headerIdentity(page)] });

    await menu.getByRole('menuitem').filter({ hasText: '1st Group A' }).first().click();
    await expect(page.locator('[role="menu"]').locator('visible=true')).toHaveCount(0);
    const filled = card.getByText('1st Group A', { exact: true });
    await expect(filled).toBeVisible();
    await centre(card);
    await shot(page, '13.9', '03-slot-filled-with-position', {
      mask: [headerIdentity(page)],
      annotate: filled,
    });

    // The round + beside the slot is a second control, and a different one: it
    // searches for a named team rather than offering positions.
    const plus = card.locator('[aria-label="Add team to slot 2"]').locator('visible=true').nth(1);
    await plus.click();
    const dialog = onScreen(page.locator('[role="dialog"]')).first();
    await expect(dialog.getByText('Select or create a team for this match slot')).toBeVisible();
    await expect(dialog.locator('input[name="teamDropdown"]')).toBeVisible();
    await shot(page, '13.9', '04-add-team-search-dialog', { mask: [headerIdentity(page)] });
    await dialog.getByRole('button', { name: 'Close' }).first().click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);

    await card.locator('[aria-label="Edit Match 1"]').locator('visible=true').first().click();
    const rename = onScreen(page.locator('[role="dialog"]')).first();
    await expect(rename.getByText('Edit match title', { exact: true })).toBeVisible();
    await expect(rename.locator('input[type="text"]')).toHaveValue('Match C1');
    await shot(page, '13.9', '05-edit-match-title', { mask: [headerIdentity(page)] });
    await rename.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);

    // Put the slot back. The seed clears it too, but leaving it filled makes
    // this spec change what 13.1, 13.3 and 13.7 photograph of the same board -
    // which showed up as four screenshots differing between two runs of the
    // suite when only the seed had been skipped.
    await asUser(
      fx.token,
      `/tournament-brackets/${bracket.id}/matches/${matchC1.tournamentMatchId}/participants`,
      { method: 'PATCH', body: { homeTeamId: '' } },
    );
  });
});
