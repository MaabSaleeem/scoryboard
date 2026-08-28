// 14.6 - Why two football fixtures clash, and fixtures showing only one team.
//
// Fixture: KB 14 Clash Cup, which is seeded already broken in the two ways the
// article explains. Nothing here writes: a spec that produced the clash itself
// would have to repair it, and three other articles photograph correct
// schedules on the other football fixtures.
//
// There is NO clash warning anywhere in the app - no badge, no banner, no
// message. Searched the whole bundle. So this article is an explanation of a
// state the organiser has already reached, not a walkthrough of a dialog, and
// the shots are symptom, cause, symptom, cause.
//
// Cause one: "Same start time per round" is ticked by default in Bulk Match
// Updates, and a football group has no rounds - so the whole group counts as one
// round and every fixture lands on one kick-off time. The reader cannot even set
// a gap without noticing, because the gap field is disabled while the box is
// ticked.
//
// Cause two: the group has more slots than teams. The spare slot pairs a real
// team against nothing, and those fixtures read "Away Team" and stay Incomplete.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures14, headerIdentity, centre, onScreen,
  scheduleReady, scheduleCard, openBulkDialog, cancelDialog, fixtureCard,
} from '../../lib/kb';

test.describe('14.6 Football fixture clashes and one-team fixtures', () => {
  test('six fixtures on one kick-off, and the empty slot behind a lone team', async ({ page }) => {
    const fx = await fixtures14();

    await signInAs(page, fx.email, `/tournaments/${fx.clashCup}/schedule`);
    await quiet(page);
    await scheduleReady(page);

    // The symptom. Six fixtures, one kick-off time, one pitch - and three of
    // them need KB 14 Bears, who cannot play three matches at once.
    const groupA = await scheduleCard(page, 'Group A');
    await expect(onScreen(groupA.getByRole('button', { name: '10:00', exact: true })))
      .toHaveCount(6);
    await centre(groupA);
    await shot(page, '14.6', '01-group-a-all-one-time', { clip: groupA });

    // The cause, in the dialog that did it. The box is ticked as it opens and
    // Time between matches is greyed out beneath it, so a reader who never
    // untick it has no way to space the fixtures out.
    const dialog = await openBulkDialog(page, groupA);
    const sameStart = dialog.locator('[role="checkbox"]').first();
    await expect(sameStart).toHaveAttribute('data-state', 'checked');
    await expect(dialog.locator('input[name="timeBetweenMatches"]')).toBeDisabled();
    await shot(page, '14.6', '02-same-start-time-ticked', {
      clip: dialog,
      annotate: sameStart.locator('xpath=..'),
    });
    // Cancelled. This spec changes nothing.
    await cancelDialog(page);

    // The second symptom: a fixture with one real team, the other side reading
    // "Away Team", and a status of Incomplete rather than Scheduled.
    const lone = await fixtureCard(page, 'Away Team');
    await expect(lone.getByText('Incomplete', { exact: true })).toBeVisible();
    await centre(lone);
    await shot(page, '14.6', '03-fixture-with-one-team', { clip: lone });

    // Its cause, on the Format tab: Group B was given five slots and only four
    // teams, so an Add Team button sits where the fifth would be. Every fixture
    // that slot is drawn into has nobody on one side.
    await page.goto(`/tournaments/${fx.clashCup}/format`);
    await quiet(page);
    await expect(page.getByText('KB 14 Foxes', { exact: true }).first()).toBeVisible();
    const groupBCard = onScreen(page.getByText('Group B', { exact: true })).first()
      .locator('xpath=ancestor::div[contains(@class,"rounded")][2]');
    const addTeam = onScreen(groupBCard.getByText('Add Team', { exact: true })).first();
    await expect(addTeam).toBeVisible();
    await centre(groupBCard);
    await shot(page, '14.6', '04-empty-slot-on-format', {
      clip: groupBCard,
      annotate: addTeam,
    });
  });
});
