// 02.6 - What your public player profile shows.
//
// The persona's own profile, seen by somebody else. The viewer is Otto rather
// than Pru because Pru already follows Pia and her button reads Unfollow; Follow
// is what a first-time visitor sees, and that is the article's third step.
//
// Reads only. The spec never selects Follow - doing so would change the persona's
// follower count, which 02.1 photographs.
//
// One thing a visitor does NOT get is the Create Match button in the Matches
// panel. That absence is shot 04, and it is a real question a reader has.

import { test, expect } from '@playwright/test';
import {
  shot, quiet, blockPromos, signInAs, onlyOurActivities, onScreen,
  fixtures02, statsReady, KB02, KB02_PROFILES, KB02_TEAMS,
  panel, statTiles, viewsCount, notificationBadge, sidebarIdentity,
} from '../../lib/kb';

test.describe('02.6 What your public player profile shows', () => {
  test('the profile a visitor sees, and what they can do from it', async ({ page }) => {
    const fx = await fixtures02();
    await statsReady(fx.player.token, fx.player.playerId);

    await blockPromos(page);
    await onlyOurActivities(page);
    await signInAs(page, KB02.owner, `/player/${fx.player.playerId}`);
    await quiet(page);

    await expect(page.getByText('Pia KB', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(KB02_PROFILES.player.bio)).toBeVisible();

    // The viewer's own name in the sidebar is incidental everywhere here - the
    // article is about the profile being looked at, not about who is looking.
    const viewer = sidebarIdentity(page, 'Otto KB');
    const views = viewsCount(page);
    const badge = notificationBadge(page);
    const follow = page.getByRole('button', { name: 'Follow', exact: true });
    await expect(follow).toBeVisible();

    // 01 - the profile as a visitor sees it.
    await shot(page, '02.6', '01-public-profile', {
      annotate: follow, mask: [viewer, views, badge],
    });

    // 02 - the controls a visitor gets across the top of the banner.
    const actions = page.getByRole('button', { name: 'Add To Team', exact: true })
      .locator('xpath=ancestor::div[2]');
    await expect(actions.getByRole('button', { name: 'Chat', exact: true })).toBeVisible();
    await expect(actions.getByRole('button', { name: 'Request Payment', exact: true })).toBeVisible();
    await shot(page, '02.6', '02-visitor-actions', { clip: actions });

    // 03 - the bio and the ten statistic tiles, both public.
    //
    // Clipped to the column that holds both rather than to the tile grid alone.
    // A capture of the grid on its own is pixel-for-pixel the same picture as
    // 02.1's, and this article is about what a VISITOR can read - which is the
    // point only when the bio is in the frame with it.
    const grid = await statTiles(page);
    const column = grid.locator('xpath=ancestor::div[1]');
    await expect(column.getByText('MY BIO', { exact: true })).toBeVisible();
    await shot(page, '02.6', '03-bio-and-statistics', { clip: column });

    // 04 - the Matches panel, on Past Matches. A visitor can read your match
    // history and gets no Create Match button.
    //
    // The tab is switched on purpose. The panel opens on Upcoming Matches, and a
    // capture of that is a tall empty box reading "No matches yet, stay tuned!" -
    // which illustrates the missing button only by absence and looks like an
    // error. Past Matches shows what a visitor can actually see.
    const matches = await panel(page, 'MATCHES');
    await expect(matches.getByRole('button', { name: 'Create Match' })).toHaveCount(0);
    await onScreen(matches.getByText('Past Matches', { exact: true })).first().click();
    await expect(matches.getByText(KB02_TEAMS.away, { exact: true })).toBeVisible();
    await shot(page, '02.6', '04-matches-no-create', { clip: matches });
  });
});
