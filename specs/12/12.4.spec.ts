// 12.4 - Choosing a format, groups and matches per team.
//
// The Format tab on the untouched "KB New Cup" is where every empty-state shot
// comes from. Nothing is saved there: saving the format writes the groups and
// generates the fixture list, and would turn the untouched fixture into a
// configured one. The saved result is captured from "KB Cup", which the seed
// already configured as Round Robin, 2 groups of 4, one encounter.

import { test, expect } from '@playwright/test';
import { signIn, quiet, shot, fixtures, headerIdentity, onScreen } from '../../lib/kb';

test.describe('12.4 Choosing a format', () => {
  test('templates, groups, teams per group and encounters', async ({ page }) => {
    const fx = await fixtures('organiser');

    await signIn(page, 'organiser', `/tournaments/${fx.newCup}/format`);
    await quiet(page);
    await page.getByText('Choose Format', { exact: true }).waitFor();

    const cards = page.getByRole('button');
    const groupOnly = cards.filter({ hasText: 'Group phase only' }).first();
    const knockoutOnly = cards.filter({ hasText: 'Knockout phase only' }).first();
    const groupAndKnockout = cards.filter({ hasText: 'Group & knockout phase' }).first();

    await shot(page, '12.4', '01-choose-format-three-templates', {
      mask: [headerIdentity(page)],
    });

    await groupOnly.click();
    await expect(page.locator('input[placeholder="Select number of groups"]:visible')).toBeVisible();
    await shot(page, '12.4', '02-group-phase-only-selected', {
      mask: [headerIdentity(page)],
      annotate: groupOnly,
    });

    // The page renders each of these fields twice - one for the wide layout and
    // one for the narrow one - and the unused twin has a zero-sized box. Matching
    // on :visible picks the one actually on screen.
    const groupCount = page.locator('input[placeholder="Select number of groups"]:visible');
    await groupCount.fill('2');
    await shot(page, '12.4', '03-how-many-groups', {
      mask: [headerIdentity(page)],
      annotate: groupCount,
    });

    const teamsPerGroup = page.locator('input[placeholder="Select teams per group"]:visible');
    await teamsPerGroup.fill('4');
    await shot(page, '12.4', '04-teams-in-each-group', {
      mask: [headerIdentity(page)],
      annotate: teamsPerGroup,
    });

    // Encounters is empty until the two numbers above are set. It is the
    // "matches per team" the map asks for, under the app's own word.
    // A combobox trigger with a hidden responsive twin, so scope to the visible
    // one. Do not match it on "Select encounters": once the group count and the
    // teams per group are set, it fills itself in with the default encounter and
    // the placeholder is gone. On this format it is the only combobox on screen.
    const encounters = page.locator('[role="combobox"]:visible').first();
    await encounters.click();
    // Assert the list opened, not one label: "Play all teams in pool once" is
    // both the first option and the selected value, so matching on it is
    // ambiguous once a default has been filled in.
    await expect(page.getByRole('option').first()).toBeVisible();
    await shot(page, '12.4', '05-encounters-open', { mask: [headerIdentity(page)] });
    await page.keyboard.press('Escape');

    const overflow = onScreen(
      page.getByText('Automatically schedule overflow matches on the next day'),
    ).first();
    await shot(page, '12.4', '06-overflow-matches-toggle', {
      mask: [headerIdentity(page)],
      annotate: overflow,
    });

    // Knockout only asks one question, and it asks it with a picker, not a
    // number field: how many teams go into the bracket.
    const knockoutTeams = onScreen(
      page.locator('[role="combobox"]').filter({ hasText: 'Select teams for knockout phase' }),
    ).first();
    await knockoutOnly.click();
    await expect(knockoutTeams).toBeVisible();
    await expect(page.locator('input[name="groupCount"]:visible')).toHaveCount(0);
    await shot(page, '12.4', '07-knockout-phase-only', {
      mask: [headerIdentity(page)],
      annotate: knockoutOnly,
    });

    // Group & knockout asks both sets of questions.
    await groupAndKnockout.click();
    await expect(page.locator('input[name="groupCount"]:visible')).toBeVisible();
    await expect(knockoutTeams).toBeVisible();
    await shot(page, '12.4', '08-group-and-knockout', {
      mask: [headerIdentity(page)],
      annotate: groupAndKnockout,
    });

    // Deliberately not saved. The saved result comes from the configured fixture.
    await page.goto(`/tournaments/${fx.cup}/format`);
    await quiet(page);
    await page.getByText(/^group a$/i).first().waitFor();
    await shot(page, '12.4', '09-format-saved-groups-generated', {
      mask: [headerIdentity(page)],
    });
  });
});
