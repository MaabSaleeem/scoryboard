// 17.1 - Collecting money through Scoryboard, an overview.
//
// Three personas, because the overview has three vantage points: somebody who has
// not set a payout account up, somebody collecting, and somebody paying.
//
// Each persona gets its OWN context. Signing a second account in on the same page
// leaves the first one's persisted Redux store behind, and that store decides
// what the Teams page and Select Team can see - see context17().
//
// The empty "Get started with payments" state comes from kb-17-nopayout@ and
// nowhere else. Mo's account has requests on it, so that screen no longer exists
// for him and cannot be put back - see lib/fixtures-17.mjs.
//
// Nothing here crosses into Stripe.

import { test, expect } from '@playwright/test';
import {
  shot, quiet17, context17, paymentHubReady, paymentTab, openSourceChooser,
  fixtures17, KB17, KB17_REQUESTS, sidebarIdentity17,
} from '../../lib/kb';

test.describe('17.1 Collecting money - an overview', () => {
  test('the three steps, the sources, and both sides of a request', async ({ browser }) => {
    const fx = await fixtures17();

    // --- an account that has never asked for money --------------------------
    const nils = await context17(browser, KB17.nopayout, '/payment');
    try {
      await expect(nils.page.getByRole('heading', { name: 'Get started with payments' }))
        .toBeVisible();
      await shot(nils.page, '17.1', '01-payment-empty-steps', {
        mask: [sidebarIdentity17(nils.page, 'Nils KB')],
      });
    } finally {
      await nils.ctx.close();
    }

    // --- the organiser's side ------------------------------------------------
    const mo = await context17(browser, KB17.pro, '/payment');
    try {
      const page = mo.page;
      await paymentHubReady(page, KB17_REQUESTS.tracked.title);

      const chooser = await openSourceChooser(page);
      await shot(page, '17.1', '02-request-payment-sources', {
        clip: chooser,
        clipPad: 8,
        annotate: page.getByRole('button', { name: /Teams Choose players/ }),
      });
      await page.getByRole('button', { name: 'Close' }).first().click();
      await expect(chooser).toBeHidden();

      await paymentHubReady(page, KB17_REQUESTS.tracked.title);
      await shot(page, '17.1', '03-requested-table', {
        mask: [sidebarIdentity17(page, 'Mo KB')],
      });

      // Where a team's own requests live. Same data, a different way in.
      await page.goto(`/teams/${fx.united}/payment`);
      await paymentHubReady(page, KB17_REQUESTS.tracked.title);
      await quiet17(page);
      await shot(page, '17.1', '05-team-payment-tab', {
        mask: [sidebarIdentity17(page, 'Mo KB')],
      });
    } finally {
      await mo.ctx.close();
    }

    // --- the payer's side ----------------------------------------------------
    const pia = await context17(browser, KB17.player, '/payment');
    try {
      await paymentTab(pia.page, 'Pay');
      await paymentHubReady(pia.page, KB17_REQUESTS.payable.title);
      await shot(pia.page, '17.1', '04-pay-tab', {
        mask: [sidebarIdentity17(pia.page, 'Pia KB')],
      });
    } finally {
      await pia.ctx.close();
    }
  });
});
