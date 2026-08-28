// 14.1 - How the fixture list is generated for a football tournament.
//
// Fixture: KB 14 Cup, whose schedule is the generated one and is never mutated
// by any spec - Group A 10:00-10:50, Group B 11:00-11:50, Bracket C 12:00-13:00,
// ten minutes apart because the tournament's match duration is 10 min and there
// is no gap.
//
// The article is about what the app produced, not about changing it, so nothing
// here clicks anything that writes. 14.3 and 14.5 are the articles that change a
// schedule, and they use KB 14 League.

import { test } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures14, headerIdentity, centre, onScreen,
  scheduleReady, scheduleCard, fixtureCard, alignTop,
} from '../../lib/kb';

test.describe('14.1 Football fixture generation', () => {
  test('the flat list per group, its kick-off times, and the knockout rounds', async ({ page }) => {
    const fx = await fixtures14();

    await signInAs(page, fx.email, `/tournaments/${fx.cup}/schedule`);
    await quiet(page);
    await scheduleReady(page);

    await shot(page, '14.1', '01-schedule-tab', { mask: [headerIdentity(page)] });

    // Group A: six fixtures, one every ten minutes. Clipped rather than taken as
    // a viewport shot, because the second group is on screen too and the article
    // is about one group's list at this point.
    const groupA = await scheduleCard(page, 'Group A');
    await centre(groupA);
    await shot(page, '14.1', '02-group-a-fixtures', { clip: groupA });

    // One fixture card, with the time outlined. The card carries four editable
    // cells - date, time, pitch, referee - and 14.5 is the article about
    // changing them; here the point is only that the generator filled the time.
    const card = await fixtureCard(page, 'KB 14 Reds');
    await centre(card);
    await shot(page, '14.1', '03-fixture-card', {
      clip: card,
      annotate: onScreen(card.getByRole('button', { name: '10:00', exact: true })).first(),
      // Inset. The time sits on the card's bottom row, so an outline drawn
      // outside it falls off the edge of the clip and only its inner border
      // survives - the same fix collection 13 needed for its column headings.
      annotatePad: -2,
    });

    // The phase tabs. A Group and Knockout tournament schedules both phases at
    // once, so the knockout fixtures already have times before anyone has
    // qualified.
    const knockoutTab = onScreen(page.getByRole('button', { name: 'Knockout Phase', exact: true })).first();
    // Clipped to the strip that holds the two phase tabs and EXPORT FIXTURES,
    // not captured as a viewport: a viewport shot here is the same frame as
    // 01 with an outline added, and gives the reader the same picture twice.
    const strip = knockoutTab.locator('xpath=ancestor::div[3]');
    await centre(strip);
    await shot(page, '14.1', '04-phase-tabs', {
      clip: strip,
      annotate: knockoutTab,
      annotatePad: -2,
    });

    // The knockout schedule is drawn as a bracket tree, not a flat list: a
    // QUARTER-FINALS column, then SEMI-FINALS, then FINAL, joined by connector
    // lines. Captured as a viewport rather than clipped to the card, because the
    // card is both wider and taller than the frame and a clip of it would be an
    // unreadable strip.
    await knockoutTab.click();
    await scheduleReady(page);
    const bracket = await scheduleCard(page, 'Bracket C');
    // alignTop, not centre: the bracket card is far taller than the frame, so
    // centring it pushes the QUARTER-FINALS heading off the top and the shot
    // shows only two of the three rounds it is meant to show.
    await alignTop(bracket);
    await shot(page, '14.1', '05-knockout-fixtures', { mask: [headerIdentity(page)] });
  });
});
