// 02.8 - Comparing your stats with other players.
//
// The collection's one free_pro article. Both halves look at the SAME third
// player - Otto - and differ only in who is looking: the Free persona and the Pro
// account. That is the single-variable pair the style guide asks for; it just
// cannot be produced by flipping one account, because Compare never appears on
// your own profile. See briefs/02.md and lib/fixtures-02.mjs.
//
// Reads only, and deliberately so: the Free gate's "FREE Upgrade (Beta)" button
// turns the account Pro, and the persona has to stay Free for this collection's
// other seven articles. It is photographed, never selected.
//
// Two tests rather than one, because they are two sessions.

import { test, expect } from '@playwright/test';
import {
  shot, quiet, blockPromos, signInAs, onlyOurActivities, onScreen, openDialog,
  fixtures02, statsReady, KB02,
  viewsCount, notificationBadge, sidebarIdentity,
} from '../../lib/kb';

test.describe('02.8 Comparing your stats with other players', () => {
  test('on Free, Compare offers the Pro upgrade', async ({ page }) => {
    const fx = await fixtures02();
    await statsReady(fx.player.token, fx.player.playerId);

    await blockPromos(page);
    await onlyOurActivities(page);
    await signInAs(page, KB02.player, `/player/${fx.owner.playerId}`);
    await quiet(page);
    await expect(page.getByText('Otto KB', { exact: true }).first()).toBeVisible();

    const viewer = sidebarIdentity(page, 'Pia KB');
    const compare = page.getByRole('button', { name: 'Compare', exact: true }).first();
    await expect(compare).toBeVisible();

    // 01 - where the button is. It is only on somebody else's profile.
    await shot(page, '02.8', '01-compare-button-free', {
      annotate: compare, mask: [viewer, viewsCount(page), notificationBadge(page)],
    });

    // 02 - the gate. NOT the upgrade: selecting it would make the persona Pro.
    await compare.click();
    const gate = openDialog(page);
    await expect(gate.getByText('Unlock Compare with Pro')).toBeVisible();
    await expect(gate.getByRole('button', { name: /FREE Upgrade/ })).toBeVisible();
    await shot(page, '02.8', '02-compare-gate-free', { clip: gate });
  });

  test('on Pro, Compare opens the table', async ({ page }) => {
    const fx = await fixtures02();
    await statsReady(fx.player.token, fx.player.playerId);

    await blockPromos(page);
    await onlyOurActivities(page);
    await signInAs(page, KB02.pro, `/player/${fx.owner.playerId}`);
    await quiet(page);
    await expect(page.getByText('Otto KB', { exact: true }).first()).toBeVisible();

    const compare = page.getByRole('button', { name: 'Compare', exact: true }).first();
    await compare.click();
    const table = openDialog(page);
    await expect(table.getByText('Compare players')).toBeVisible();
    // Gate on a row with real numbers in it, not on the heading: the modal draws
    // its frame before the two stat fetches land.
    await expect(table.getByText('Assists', { exact: true })).toBeVisible();
    await expect(table.getByText('Pru KB', { exact: true })).toBeVisible();
    await expect(table.getByText('Otto KB', { exact: true })).toBeVisible();

    // 03 - the whole table, you against them across the ten statistics.
    await shot(page, '02.8', '03-compare-table-pro', { clip: table });

    // 04 - the arrows. Win is the row where the two columns disagree, so the
    // green up and the red down are side by side and readable. It is a real
    // <table>, so the row is the <tr>.
    const winRow = onScreen(
      table.getByText('Win', { exact: true }).locator('xpath=ancestor::tr[1]'),
    ).first();
    await expect(winRow).toBeVisible();
    await shot(page, '02.8', '04-compare-arrows-pro', { clip: table, annotate: winRow });
  });
});
