// 17.8 - Paying a request you have received.
//
// STOPS AT THE HANDOFF. Pay Now fires POST /payments/transaction/:id/pay and
// swaps the window for Stripe Elements - card number, expiry, security code.
// On instruction for this run, the last capture is Pay Now before it is pressed,
// and no payment is ever made.
//
// This is the only screen in the app where the fee is visible to the person
// paying it: the Amount column is what they will actually be charged, £10.56 for
// a £10 pass-through request and £15.00 for a £15 absorbed one.

import { test, expect } from '@playwright/test';
import {
  shot, quiet17, context17, paymentTab, paymentHubReady, requestRow,
  fixtures17, feeBreakdown, KB17, KB17_REQUESTS, sidebarIdentity17,
} from '../../lib/kb';

test.describe('17.8 Paying a request you have received', () => {
  test('finding it, checking it, and where Scoryboard hands over', async ({ browser }) => {
    const fx = await fixtures17();
    const subject = KB17_REQUESTS.payable.title;
    const { total } = feeBreakdown(KB17_REQUESTS.payable.basePrice);   // £5 -> £5.39

    const pia = await context17(browser, KB17.player, '/payment');
    try {
      const page = pia.page;
      await paymentTab(page, 'Pay');
      await paymentHubReady(page, subject);

      await shot(page, '17.8', '01-pay-tab', {
        mask: [sidebarIdentity17(page, 'Pia KB')],
      });

      const row = requestRow(page, subject)
        .locator('xpath=ancestor::div[contains(@class,"grid")][1]');
      await expect(row).toContainText(`£${total.toFixed(2)}`);
      await shot(page, '17.8', '02-pay-row', {
        mask: [sidebarIdentity17(page, 'Pia KB')],
        annotate: row.getByRole('button', { name: 'Pay', exact: true }),
      });

      await row.getByRole('button', { name: 'Pay', exact: true }).click();
      const details = page.getByRole('dialog').filter({ hasText: 'Payment Details' }).first();
      await expect(details).toBeVisible();
      await expect(details.getByText(`£${total.toFixed(2)}`)).toBeVisible();
      await shot(page, '17.8', '03-payment-details-payer', {
        clip: details, clipPad: 8,
        annotate: details.getByText(`£${total.toFixed(2)}`),
      });

      const payTo = details.getByText('Mo KB', { exact: true })
        .locator('xpath=ancestor::div[1]');
      await shot(page, '17.8', '04-pay-to', {
        clip: details, clipPad: 8, annotate: payTo,
      });

      const payNow = details.getByRole('button', { name: 'Pay Now', exact: true });
      await expect(payNow).toBeEnabled();
      await shot(page, '17.8', '05-pay-now', {
        clip: details, clipPad: 8, annotate: payNow,
      });
      // STOP. Pay Now is never pressed - everything past it is Stripe's.

      await page.getByRole('button', { name: 'Close' }).first().click();
      await expect(details).toBeHidden();

      // The same request, reached from the team instead of the hub.
      await page.goto(`/teams/${fx.united}/payment`);
      await paymentHubReady(page, KB17_REQUESTS.tracked.title);
      await quiet17(page);
      await shot(page, '17.8', '06-team-payment-pay', {
        mask: [sidebarIdentity17(page, 'Pia KB')],
      });
    } finally {
      await pia.ctx.close();
    }
  });
});
