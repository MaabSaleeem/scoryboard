// 04.6 - Free Tournament Pro slots.
//
// Was 16.6, and the one article absorbed from that collection with no money in
// it at all: a slot is granted by Scoryboard, and it makes the next tournament
// you create Pro without a checkout.
//
// Two shots, not three. The article has two states worth showing - the panel on
// the Tournament Pro tab, and the panel on its own - and the third thing a
// reader might want, a slot being spent, cannot be shown honestly here: it needs
// a tournament created on this account, which would take the count to 1 and
// change what every later run photographs.
//
// The grant has NO revoke (config/api.md), so this account can never show the
// paywall again. That is why it is its own address and why 04.4 and 04.5 use a
// different one. `scripts/seed-04.mjs` tops the allowance up to exactly
// FREE_PRO_SLOTS by granting only the shortfall - granting a flat quantity every
// run would walk the number up, and the number is the subject of the capture.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, onScreen, fixtures04, tournamentTabReady, freeSlotsPanel,
  hideSidebarIdentity, unstickHeader, KB04,
} from '../../lib/kb';

const ARTICLE = '04.6';

test.describe('04.6 Free Tournament Pro slots', () => {
  test('the allowance panel on an account that has slots', async ({ page }) => {
    test.setTimeout(180_000);
    const fx = await fixtures04();

    await signInAs(page, fx.grant.email, '/subscriptions');
    await quiet(page);
    await tournamentTabReady(page);
    await hideSidebarIdentity(page, 'Gia KB');

    const panel = freeSlotsPanel(page);
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(KB04.FREE_SLOTS_TITLE);
    await expect(panel).toContainText(
      `Your next ${KB04.FREE_PRO_SLOTS} tournaments will automatically get Tournament Pro at no extra cost.`,
    );
    await expect(panel).toContainText(String(KB04.FREE_PRO_SLOTS));

    // 1. Where it sits: above the three plan cards, on the Tournament Pro tab.
    await unstickHeader(page);
    await shot(page, ARTICLE, '01-slots-on-the-tab', { fullPage: true });

    // 2. The panel itself, and the number.
    await shot(page, ARTICLE, '02-free-slots-panel', {
      clip: panel, clipPad: 16, annotate: panel, annotatePad: 8,
    });

    // The plans are still offered underneath: a slot covers the NEXT tournament
    // you create, it does not turn the account into an Annual subscriber.
    await expect(
      onScreen(page.getByRole('button', { name: KB04.TOURNAMENT_PLANS.pro.button, exact: true })).first(),
    ).toBeVisible();
  });
});
