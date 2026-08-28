// 12.1 - Tournaments explained: the states a tournament moves through.
//
// Read-only. Nothing in this spec creates, edits or deletes anything.
//
// Note for the reviewer: this build has no Draft state. A tournament is created
// Published. What the list distinguishes is "format not chosen yet" from
// "format chosen", and the article is written against that. See briefs/12.md,
// open question 1.

import { test } from '@playwright/test';
import { signIn, quiet, shot, fixtures, headerIdentity, tournamentListReady } from '../../lib/kb';

test.describe('12.1 Tournaments explained', () => {
  test('states a tournament moves through', async ({ page }) => {
    const fx = await fixtures('organiser');

    await signIn(page, 'organiser', '/tournaments');
    await quiet(page);

    // Wait for the list to settle before capturing: it renders a count of zero
    // and grey skeletons until the fetch lands.
    await tournamentListReady(page);

    // Mask the header name and nothing else, per the brief's screenshot table.
    // "Created on <date>" is the tournament's stored creation date, not today's,
    // so it is already stable; masking it only put a black bar across each card.
    await shot(page, '12.1', '01-tournament-list-both-states', {
      mask: [headerIdentity(page)],
    });

    // KB New Cup has no format, so its Format tab still shows the chooser.
    await page.goto(`/tournaments/${fx.newCup}/format`);
    await quiet(page);
    await page.getByText('Choose Format', { exact: true }).waitFor();
    await shot(page, '12.1', '02-format-not-chosen-yet', {
      mask: [headerIdentity(page)],
    });

    // The public page is what everyone else sees, at the singular /tournament path.
    await page.goto(`/tournament/${fx.cup}/info`);
    await quiet(page);
    await page.getByText(/tournament format/i).first().waitFor();
    await shot(page, '12.1', '03-public-page-info', {
      mask: [headerIdentity(page)],
    });
  });
});
