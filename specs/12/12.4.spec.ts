// 12.4 - Choosing a format, groups and matches per team.
//
// RE-CAPTURED 2026-09-08, on the repo owner's decision to reopen collection 12's
// do-not-re-run for this one article. See 8sept-updates.md A5 and briefs/12.md.
//
// What changed in the product: the "Automatically schedule overflow matches on
// the next day" Yes/No control is **gone from Group phase only**. A **League
// schedule** block stands where it was. The control survives unchanged on
// Knockout phase only and on Group & knockout phase, which the article used to
// say asked about knockout counts alone.
//
// So shot 06 was re-pointed. It used to capture the overflow control inside the
// Group-phase-only step list, where it no longer is. It now captures the League
// schedule block, in the same position in the same flow. Shots 07 and 08 gained
// an assertion that the overflow control IS on the other two templates - that is
// the half of the change the article was silent about, so it is worth failing
// over.
//
// Nothing here saves. The Format tab of the untouched "KB New Cup" is read and
// left alone, exactly as before.
//
// The Format tab on the untouched "KB New Cup" is where every empty-state shot
// comes from. Nothing is saved there: saving the format writes the groups and
// generates the fixture list, and would turn the untouched fixture into a
// configured one. The saved result is captured from "KB Cup", which the seed
// already configured as Round Robin, 2 groups of 4, one encounter.

import { test, expect } from '@playwright/test';
import { signIn, quiet, shot, fixtures, headerIdentity, onScreen, centre } from '../../lib/kb';

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
    // The three format fields sit below the template cards. Without centring
    // them they land flush against the bottom edge and the annotation outline is
    // cut off by the viewport.
    await centre(groupCount);
    await shot(page, '12.4', '03-how-many-groups', {
      mask: [headerIdentity(page)],
      annotate: groupCount,
    });

    const teamsPerGroup = page.locator('input[placeholder="Select teams per group"]:visible');
    await teamsPerGroup.fill('4');
    await centre(teamsPerGroup);
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
    // Centre before opening: the option list is portalled and positioned once,
    // so scrolling afterwards would leave it detached from its trigger.
    await centre(encounters);
    await encounters.click();
    // Assert the list opened, not one label: "Play all teams in pool once" is
    // both the first option and the selected value, so matching on it is
    // ambiguous once a default has been filled in.
    await expect(page.getByRole('option').first()).toBeVisible();
    await shot(page, '12.4', '05-encounters-open', { mask: [headerIdentity(page)] });
    await page.keyboard.press('Escape');

    // Group phase only has no overflow question any more. Assert the absence
    // before capturing what replaced it: if the control ever comes back, this
    // fails and the article's per-template scoping is wrong again.
    await expect(
      page.getByText('Automatically schedule overflow matches on the next day'),
    ).toHaveCount(0);

    const leagueSchedule = onScreen(page.getByText('League schedule', { exact: true })).first();
    await expect(leagueSchedule).toBeVisible();
    // The block, not the heading: the heading alone tells a reader nothing. Walk
    // up to the container that holds Scheduling mode through Preferred match
    // day(s).
    const scheduleBlock = leagueSchedule.locator('xpath=..');
    await expect(scheduleBlock.getByText('Scheduling mode', { exact: true })).toBeVisible();
    await expect(scheduleBlock.getByText('Preferred match day(s)', { exact: true })).toBeVisible();
    await centre(leagueSchedule);
    await shot(page, '12.4', '06-league-schedule', {
      mask: [headerIdentity(page)],
      annotate: scheduleBlock,
    });

    // Knockout only asks one question, and it asks it with a picker, not a
    // number field: how many teams go into the bracket.
    const knockoutTeams = onScreen(
      page.locator('[role="combobox"]').filter({ hasText: 'Select teams for knockout phase' }),
    ).first();
    await knockoutOnly.click();
    await expect(knockoutTeams).toBeVisible();
    await expect(page.locator('input[name="groupCount"]:visible')).toHaveCount(0);
    // The overflow control lives HERE now, and the article says so. It was
    // previously documented as a Group-phase-only question and this template was
    // described as asking one thing.
    await expect(
      onScreen(page.getByText('Automatically schedule overflow matches on the next day')).first(),
    ).toBeVisible();
    await centre(knockoutTeams);
    await shot(page, '12.4', '07-knockout-phase-only', {
      mask: [headerIdentity(page)],
      annotate: knockoutOnly,
    });

    // Group & knockout asks both sets of questions.
    await groupAndKnockout.click();
    await expect(page.locator('input[name="groupCount"]:visible')).toBeVisible();
    await expect(knockoutTeams).toBeVisible();
    await expect(
      onScreen(page.getByText('Automatically schedule overflow matches on the next day')).first(),
    ).toBeVisible();
    await expect(page.getByText('League schedule', { exact: true })).toHaveCount(0);
    // Centre the first field rather than the knockout one: this format shows two
    // rows of fields, and centring the lower row pushes the annotated card off
    // the top of the viewport.
    await centre(page.locator('input[name="groupCount"]:visible'));
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
