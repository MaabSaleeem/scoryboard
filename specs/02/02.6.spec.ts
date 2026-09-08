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
//
// --- Shots 05 and 06, added 2026-09-08 -----------------------------------
//
// 8sept-updates.md A10. The article said "every profile is laid out the same
// way" and told a reader to check their own by opening somebody else's, because
// "the layout is identical". A PADEL profile is a different layout: no Matches
// panel, no Leaderboards table, a LEVEL panel, a PADEL TOURNAMENTS panel, and
// five of its ten tiles do not exist on the football side.
//
// This is not a padel-reader-only problem, which is why it lands in this
// article and not in a padel one. `defaultProfile` decides which side a profile
// OPENS on, so a football-only reader who follows step 1 and opens a padel
// account's profile lands on a layout they have never seen. Perry KB is seeded
// with `defaultProfile: 'Padel'` for exactly that - see lib/fixtures-02.mjs.
//
// Perry plays no match and joins no team on purpose. The layout is the subject.

import { test, expect } from '@playwright/test';
import {
  shot, quiet, blockPromos, signInAs, onlyOurActivities, onScreen,
  fixtures02, statsReady, KB02, KB02_PROFILES, KB02_TEAMS, KB02_PADEL,
  panel, statTiles, padelStatTiles, profileSwitch, viewsCount, notificationBadge,
  sidebarIdentity, centre,
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

    // --- the padel layout, seen by the same visitor ------------------------
    //
    // Same session, same viewer, one navigation. Two shots rather than one: 05
    // is the switch that says a profile has two sides, 06 is the tile grid,
    // which is the half a reader will compare against their own.
    await page.goto(`/player/${fx.padel.playerId}`);
    await quiet(page);
    await expect(page.getByText('Perry KB', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(KB02_PADEL.padelBio)).toBeVisible();

    // The proof this is the padel side and not the football one, asserted
    // before the capture rather than read off the picture afterwards: the
    // LEVEL panel and the PADEL TOURNAMENTS panel exist, and the Matches panel
    // and the Leaderboards table do not.
    // "Level Progress" is the panel's own title, and the reliable one. The
    // heading above it renders as "LEVEL" on screen but is not that string in
    // the DOM - the same CSS-uppercase trap the tile grid has.
    await expect(onScreen(page.getByText('Level Progress', { exact: true })).first())
      .toBeVisible();
    await expect(onScreen(page.getByText('PADEL TOURNAMENTS', { exact: true })).first())
      .toBeVisible();
    await expect(page.locator('main h3').filter({ hasText: /^MATCHES$/i })).toHaveCount(0);
    await expect(page.locator('main h3').filter({ hasText: /^Leaderboards$/i })).toHaveCount(0);

    // 05 - the two-pill switch. It is what tells a reader the profile has a
    // second side at all, and it is the only control on the page that does.
    const roleSwitch = profileSwitch(page);
    await expect(roleSwitch.locator('[role="radio"]')).toHaveCount(2);
    await shot(page, '02.6', '05-padel-profile', {
      annotate: roleSwitch, mask: [viewer, views, badge],
    });

    // 06 - the padel tile grid, clipped. Five of these ten do not exist on the
    // football side, which is the sentence this shot has to carry.
    const padelGrid = await padelStatTiles(page);
    await centre(padelGrid);
    await shot(page, '02.6', '06-padel-statistics', { clip: padelGrid });
  });
});
