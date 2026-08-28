// 02.1 - The main navigation and your home feed.
//
// The home page is not a feed of other people's posts. It is the reader's own
// profile dashboard - banner, photo, rating, counters, bio, ten statistic tiles,
// team rank, teams and matches - with a Trending strip and a leaderboards table
// under it. This spec photographs it in the order the article walks it.
//
// Reads only. Nothing here writes anything.
//
// Two things are handled rather than photographed as they come:
//
//   blockPromos()        the "Summer competition" banner is a live campaign that
//                        changes with whatever marketing is running, and it
//                        pushes the whole page down. Blocked, not dismissed:
//                        dismissing writes the dismissal to the account, so the
//                        first run would differ from the second.
//   onlyOurActivities()  Trending is a GLOBAL feed - other collections' fixtures
//                        and other people's accounts. See lib/kb.ts for why it is
//                        narrowed to this collection's own entries rather than
//                        hidden, and briefs/02.md for the same in prose.

import { test, expect } from '@playwright/test';
import {
  shot, quiet, blockPromos, signInAs, onlyOurActivities,
  fixtures02, statsReady, KB02, KB02_PROFILES,
  sidebar, sidebarHeader, sidebarNav, searchBox, statTiles, panel,
  profileHeader, viewsCount, notificationBadge, trendingTimes,
} from '../../lib/kb';

test.describe('02.1 The main navigation and your home feed', () => {
  test('the sidebar, the search box, your header, your statistics and Trending', async ({ page }) => {
    const fx = await fixtures02();
    // Statistics are written asynchronously after the seed's match finishes. A
    // capture taken before they land shows a profile with no history at all.
    await statsReady(fx.player.token, fx.player.playerId);

    await blockPromos(page);
    await onlyOurActivities(page);
    await signInAs(page, KB02.player, '/');
    await quiet(page);

    // Gate on something only the loaded page has. The shell paints its panels
    // before the fetches land.
    await expect(page.getByText(KB02_PROFILES.player.bio)).toBeVisible();
    // Case-insensitive: the tile labels are upper-cased by CSS and the DOM text
    // underneath is inconsistent - "WIN", "Loss", "goals scored", "ASSISTS".
    await expect(page.getByText(/^goals scored$/i).first()).toBeVisible();

    const views = viewsCount(page);
    const badge = notificationBadge(page);

    // 01 - the page as it opens. A viewport capture, not full page: this is what
    // the reader actually sees on signing in, and the full page is 1900px tall.
    await shot(page, '02.1', '01-home-page', { mask: [views, badge] });

    // 02 - the navigation itself.
    const nav = await sidebarNav(page);
    await shot(page, '02.1', '02-sidebar-navigation', {
      clip: sidebar(page), annotate: nav, mask: [badge],
    });

    // 03 - the search box, which is in the block above the navigation.
    const header = await sidebarHeader(page);
    await shot(page, '02.1', '03-search-box', {
      clip: header, annotate: searchBox(page), annotatePad: -2,
    });

    // 04 - the strip at the top of the page. Views rises every time any account
    // opens the profile, including the ones these specs sign in as.
    const head = await profileHeader(page);
    await shot(page, '02.1', '04-profile-header', { clip: head, mask: [views] });

    // 05 - the ten statistic tiles.
    await shot(page, '02.1', '05-your-statistics', { clip: await statTiles(page) });

    // 06 - Trending. The relative timestamps move every run and are masked; the
    // entries themselves are this collection's own, by onlyOurActivities().
    const trending = await panel(page, 'Trending');
    await expect(trending.getByText(/has finished$/)).toBeVisible();
    await shot(page, '02.1', '06-trending', {
      clip: trending, mask: [trendingTimes(page)],
    });
  });
});
