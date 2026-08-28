// 14.2 - How the fixture list is generated for a padel tournament.
//
// Fixture: KB 14 Padel Cup, Swiss, four pairs, four rounds, four courts, ten
// minutes between rounds. Its schedule is the generated one and no spec changes
// it: rounds at 10:00 / 10:20 / 10:40 / 11:00, two matches in each, on courts 1
// and 2.
//
// The step between rounds is the match duration plus "Gap between rounds
// (minutes)" from Padel Configuration - 10 + 10 - which is why it is 20 and not
// 10. 14.4 is the article that changes it.
//
// Nothing here writes.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures14, headerIdentity, centre, onScreen,
  scheduleReady, scheduleCard, fixtureCard,
} from '../../lib/kb';

test.describe('14.2 Padel fixture generation', () => {
  test('rounds, the start time they share, and the court each match is given', async ({ page }) => {
    const fx = await fixtures14();

    await signInAs(page, fx.email, `/tournaments/${fx.padelCup}/schedule`);
    await quiet(page);
    await scheduleReady(page);

    await shot(page, '14.2', '01-schedule-tab', { mask: [headerIdentity(page)] });

    // The whole group: four rounds, each its own section under a heading. Taller
    // than the viewport, so it is clipped rather than captured as a frame - the
    // point of the shot is that the list is grouped into rounds at all, which a
    // viewport showing only the first two would not carry.
    const groupA = await scheduleCard(page, 'Group A');
    await centre(groupA);
    await shot(page, '14.2', '02-round-sections', { clip: groupA });

    // One round: two matches, one start time. The headings render upper case
    // through CSS, so the DOM text is "Round 1".
    const roundOne = onScreen(page.getByText('Round 1', { exact: true })).first()
      .locator('xpath=ancestor::section[1]');
    await expect(roundOne.getByText('10:00', { exact: true }).first()).toBeVisible();
    await centre(roundOne);
    await shot(page, '14.2', '03-round-one-shared-time', { clip: roundOne });

    // The court. A padel fixture card carries date, time, COURT and referee where
    // a football one carries date, time, pitch and referee - the third cell is
    // the only difference between the two sports on this screen.
    const card = await fixtureCard(page, 'Player 1 & Player 2');
    await centre(card);
    await shot(page, '14.2', '04-court-number', {
      clip: card,
      annotate: onScreen(card.getByRole('button', { name: '1', exact: true })).first(),
      // Inset: the cell sits on the card's bottom row, so an outline drawn
      // outside it would fall off the edge of the clip.
      annotatePad: -2,
    });

    // Swiss explains the shape of the list above it - fixed pairs, a set number
    // of rounds, and opponents chosen by standing after each one. Reached from a
    // rule's own text because the panel heading is upper-cased by CSS and split
    // across elements.
    const rules = page.getByText('Teams remain fixed throughout the tournament.')
      .locator('xpath=ancestor::section[1]');
    await expect(rules).toBeVisible();
    await centre(rules);
    await shot(page, '14.2', '05-swiss-rules', { clip: rules });
  });
});
