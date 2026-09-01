// 17.9 - Payment statuses and failed payments.
//
// RETITLED. The map called this "Payment statuses, failed payments and refunds".
// The app has no refund feature: `refund` appears zero times across every chunk
// it loads, there is no endpoint, and there is no control on any screen. The
// article covers the statuses and says a refund is a support request.
//
// Only Pending and Cancelled are photographed. Paid, Processing and Failed all
// need a completed or declined card payment through Stripe, which this run does
// not make - see briefs/17.md, Unreachable. They are described in prose from the
// enum and the colours the bundle assigns them.
//
// The Cancelled state comes from KB 17 Away travel, which the SEED cancels. No
// spec cancels anything: a cancelled request cannot be revived and the row stays
// in the table for ever.

import { test, expect } from '@playwright/test';
import {
  shot, context17, openRequest, paymentTab, paymentHubReady, requestRow,
  fixtures17, KB17, KB17_REQUESTS, sidebarIdentity17, participantRows,
} from '../../lib/kb';

test.describe('17.9 Payment statuses', () => {
  test('pending, cancelled, and what a cancelled request can no longer do', async ({ browser }) => {
    await fixtures17();

    const mo = await context17(browser, KB17.pro, '/payment');
    try {
      const page = mo.page;
      await paymentHubReady(page, KB17_REQUESTS.tracked.title);

      const statusHeader = page.getByText('Status', { exact: true })
        .locator('visible=true').first()
        .locator('xpath=ancestor::div[contains(@class,"grid")][1]');
      await shot(page, '17.9', '01-status-column', {
        mask: [sidebarIdentity17(page, 'Mo KB')],
        annotate: statusHeader,
      });

      const details = await openRequest(page, KB17_REQUESTS.tracked.title);
      // The rows are below the window's fold; clip to them directly.
      await shot(page, '17.9', '02-participant-pending', {
        clip: participantRows(details), clipPad: 12,
      });
      await page.getByRole('button', { name: 'Close' }).first().click();

      // The cancelled fixture.
      await paymentHubReady(page, KB17_REQUESTS.cancelled.title);
      const cancelledRow = requestRow(page, KB17_REQUESTS.cancelled.title)
        .locator('xpath=ancestor::div[contains(@class,"grid")][1]');
      await expect(cancelledRow).toContainText('Cancelled');
      await shot(page, '17.9', '04-cancelled-row', {
        mask: [sidebarIdentity17(page, 'Mo KB')],
        annotate: cancelledRow,
      });

      // Every action on it is disabled. That is the clearest statement of what
      // cancelling costs, and it is why the article tells people to be sure.
      const dead = await openRequest(page, KB17_REQUESTS.cancelled.title);
      await expect(dead.getByRole('button', { name: 'Edit', exact: true })).toBeDisabled();
      await expect(dead.getByRole('button', { name: 'Add participants', exact: true })).toBeDisabled();
      await expect(dead.getByRole('button', { name: 'Cancel request', exact: true })).toBeDisabled();
      const actions = dead.getByText('Rules & Actions', { exact: true })
        .locator('xpath=ancestor::div[1]');
      await shot(page, '17.9', '05-cancelled-actions-disabled', {
        clip: dead, clipPad: 8, annotate: actions,
      });
    } finally {
      await mo.ctx.close();
    }

    // --- the same request, from the payer's side -----------------------------
    const pia = await context17(browser, KB17.player, '/payment');
    try {
      const p = pia.page;
      await paymentTab(p, 'Pay');
      await paymentHubReady(p, KB17_REQUESTS.payable.title);
      const row = requestRow(p, KB17_REQUESTS.payable.title)
        .locator('xpath=ancestor::div[contains(@class,"grid")][1]');
      await expect(row).toContainText('Pending');
      await shot(p, '17.9', '03-payer-status', {
        mask: [sidebarIdentity17(p, 'Pia KB')],
        annotate: row,
      });
    } finally {
      await pia.ctx.close();
    }
  });
});
