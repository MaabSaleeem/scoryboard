// 14.7 - Why padel matches share a start time, and when that is a clash.
//
// Two fixtures, because the article is a comparison:
//   KB 14 Padel Cup   - correct. Two matches at 10:00, on courts 1 and 2.
//   KB 14 Padel Clash - broken. Every match at 10:00, all of them on court 1.
//
// Neither is changed here. The broken one is seeded broken, for the same reason
// as 14.6's: a spec that made the clash would have to repair it, and 14.2 and
// 14.4 photograph correct padel schedules.
//
// The distinction the article turns on: a shared start time is not a clash by
// itself - it is what a round IS. It becomes a clash when the matches sharing it
// also share a court, which the generator never does on its own. It takes a bulk
// update, which writes one court number across every match it touches.
//
// The generator will not double-book even when asked: setting Courts to 1 makes
// it split the round across two start times instead. Verified 2026-08-28.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures14, headerIdentity, centre, onScreen,
  scheduleReady, scheduleCard, fixtureCard, openDialog, cancelDialog,
} from '../../lib/kb';

test.describe('14.7 Padel shared start times', () => {
  test('one round on two courts, and the same round forced onto one', async ({ page }) => {
    const fx = await fixtures14();

    await signInAs(page, fx.email, `/tournaments/${fx.padelCup}/schedule`);
    await quiet(page);
    await scheduleReady(page);

    // Intended. Both matches of Round 1 kick off at 10:00 because they are one
    // round; they are on different courts, so nothing is wrong.
    const roundOne = onScreen(page.getByText('Round 1', { exact: true })).first()
      .locator('xpath=ancestor::section[1]');
    await expect(roundOne.getByRole('button', { name: '10:00', exact: true })).toHaveCount(2);
    await centre(roundOne);
    await shot(page, '14.7', '01-round-one-two-courts', { clip: roundOne });

    // The court number is the cell that settles it. This is the second match of
    // the round, on court 2.
    const second = await fixtureCard(page, 'Player 3 & Player 4');
    await centre(second);
    await shot(page, '14.7', '02-court-number-outlined', {
      clip: second,
      annotate: onScreen(second.getByRole('button', { name: '2', exact: true })).first(),
      annotatePad: -2,
    });

    // The clash. Every match in the group at 10:00 AND on court 1 - eight
    // matches, one court, one kick-off. A bulk update with a court number in it
    // does this, because that field writes the same court to every match.
    await page.goto(`/tournaments/${fx.padelClash}/schedule`);
    await quiet(page);
    await scheduleReady(page);
    const clashGroup = await scheduleCard(page, 'Group A');
    await expect(onScreen(clashGroup.getByRole('button', { name: '10:00', exact: true })))
      .toHaveCount(8);
    await expect(onScreen(clashGroup.getByRole('button', { name: '1', exact: true })))
      .toHaveCount(8);
    await centre(clashGroup);
    await shot(page, '14.7', '03-every-match-court-one', { clip: clashGroup });

    // How many courts the tournament thinks it has, which is what decides how
    // many matches a round can hold. Four here, which is why the generator was
    // able to give Round 1 two different courts in the first place.
    await page.goto(`/tournaments/${fx.padelCup}/format`);
    await quiet(page);
    await expect(page.getByText('Player 1 & Player 2', { exact: true }).first()).toBeVisible();
    await onScreen(page.getByRole('button', { name: 'Configuration', exact: true })).first().click();
    const config = openDialog(page);
    await expect(config.getByText('Padel Configuration', { exact: true })).toBeVisible();
    await shot(page, '14.7', '04-courts-in-configuration', {
      clip: config,
      annotate: config.locator('input[name="padelCourtCount"]'),
    });
    await cancelDialog(page);
  });
});
