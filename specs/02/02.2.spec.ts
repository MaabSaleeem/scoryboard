// 02.2 - Searching for players and teams.
//
// One box, at the top of the sidebar, on every screen. It calls
// GET /team-players/search?query=&searchType=all&limit=20&skip=0 and answers with
// players, teams AND leaderboards in one list, each carrying a type chip.
//
// Reads only. Nothing here writes anything.
//
// The three captures are viewport shots rather than clips. The results are a
// portalled popover that is not inside the search box's own element, so no single
// element contains both the box and the list; a clip to the sidebar would be a
// 255 x 900 strip with content only at the top. The viewport shows where the box
// is, which is half of what this article is for.
//
// Search is global, so a result list is not entirely under this collection's
// control. Both terms were chosen to match only this collection's own fixtures.

import { test, expect } from '@playwright/test';
import {
  shot, quiet, blockPromos, signInAs, onlyOurActivities,
  fixtures02, KB02, searchBox, searchResults, viewsCount, hideNotificationBadge,
} from '../../lib/kb';

test.describe('02.2 Searching for players and teams', () => {
  test('team results, every result type, and the three-character rule', async ({ page }) => {
    await fixtures02();

    await blockPromos(page);
    await onlyOurActivities(page);
    await signInAs(page, KB02.player, '/');
    await quiet(page);

    const box = searchBox(page);
    // Every assertion below is scoped to the dropdown. The team names are also on
    // the Trending cards behind it, and a page-wide match is ambiguous.
    const results = searchResults(page);
    const views = viewsCount(page);
    // Hidden, not masked. The open dropdown covers the bell but not the badge
    // that hangs off its corner, so a mask here is a black square beside nothing.
    await hideNotificationBadge(page);

    // 01 - two teams. KB 02 City carries External because the account is not a
    // member of it; KB 02 Rovers, which she plays for, does not.
    await box.click();
    await box.fill('KB 02');
    await expect(results.getByText('KB 02 City', { exact: true })).toBeVisible();
    await expect(results.getByText('KB 02 Rovers', { exact: true })).toBeVisible();
    const external = results.getByText('External', { exact: true }).first();
    await expect(external).toBeVisible();
    await shot(page, '02.2', '01-search-teams', {
      annotate: external, annotatePad: 3, mask: [views],
    });

    // 02 - the same box finds players and leaderboards too. "Pru" matches the
    // Pro account, its two default teams and its leaderboard.
    await box.fill('Pru');
    await expect(results.getByText('Pru KB', { exact: true })).toBeVisible();
    await expect(results.getByText("Pru's leaderboard", { exact: true })).toBeVisible();
    await shot(page, '02.2', '02-search-all-types', { mask: [views] });

    // 03 - fewer than three characters. The box says so and the list is empty.
    await box.fill('KB');
    await expect(page.getByText('Please enter at least 3 characters')).toBeVisible();
    await expect(results.getByText('No results found')).toBeVisible();
    await shot(page, '02.2', '03-too-few-characters', {
      annotate: page.getByText('Please enter at least 3 characters'),
      mask: [views],
    });
  });
});
