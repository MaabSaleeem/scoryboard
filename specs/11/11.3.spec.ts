// 11.3 - When your statistics update after a match.
//
// Two preconditions and a lag. The match has to be finished, and it has to
// belong to a leaderboard; then the numbers are written within seconds. Both
// preconditions are in one card - MATCH ENDED and the leaderboard name sit in
// the same strip - so shot 01 carries both.
//
// Shot 02 is the Leaderboards table at the foot of Home, which is where the
// numbers land and the only screen that says WHICH leaderboard they came from.
// Deliberately not the ten tiles again: 11.2 photographs those, and the same
// element twice is two files of one picture.
//
// The lag itself cannot be photographed. It was measured instead, off
// statsCalculatedAt minus finishedAt on this collection's four matches: 1.6,
// 5.7, 6.4 and 6.8 seconds. The article says a few seconds and tells the reader
// to reload.
//
// Reads only. Nothing here writes anything.

import { test, expect } from '@playwright/test';
import {
  shot, quiet, blockPromos, signInAs, onScreen,
  fixtures11, stats11Ready, KB11, KB11_LEAGUE,
  openMatch, matchSection, panel,
} from '../../lib/kb';

test.describe('11.3 When your statistics update after a match', () => {
  test('the two things that have to be true, and where the numbers land', async ({ page }) => {
    const fx = await fixtures11();
    await stats11Ready(fx);

    await blockPromos(page);
    await signInAs(page, KB11.player, '/');
    await quiet(page);

    // 01 - the finished match. MATCH ENDED and the leaderboard it belongs to.
    // Gate on the leaderboard name: the card paints its teams before the match
    // fetch lands, and the strip along the bottom arrives with it.
    await openMatch(page, fx.match.win, KB11_LEAGUE);
    const details = matchSection(page, 'match-details');
    // Case-insensitive: the pill reads MATCH ENDED on screen and "Match Ended"
    // in the DOM - the same text-transform trap collections 14, 07 and 01 hit.
    await expect(onScreen(details.getByText(/^match ended$/i)).first()).toBeVisible();
    const league = onScreen(details.getByText(KB11_LEAGUE, { exact: true })).first();
    await expect(league).toBeVisible();
    await shot(page, '11.3', '01-match-details-leaderboard', {
      clip: details, annotate: league,
    });

    // 02 - where they land. One row per leaderboard, with the reader's own rank,
    // matches, goals, assists and cards in it.
    //
    // The second row is the account's born leaderboard, which has no matches in
    // it and reads zero across. It stays in the frame: a reader with the same
    // empty row should see it here rather than wonder what they have done wrong.
    await page.goto('/');
    const boards = await panel(page, 'Leaderboards');
    const row = boards.locator('xpath=.//*[contains(text(),"' + KB11_LEAGUE + '")]/ancestor::div[3]').first();
    await expect(onScreen(boards.getByText(KB11_LEAGUE, { exact: true })).first()).toBeVisible();
    await expect(row).toBeVisible();
    await shot(page, '11.3', '02-leaderboards-table', { clip: boards, annotate: row });
  });
});
