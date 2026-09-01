// 17.7 - Tracking money you have asked for.
//
// KB 17 Pitch hire is this article's subject and no spec mutates it.
//
// Two things the table does that are easy to misread, and both are in the shots:
// Total is Per Person multiplied by the number of people, and both are the BASE
// price - the transaction fee is nowhere in this table. Paid and Unpaid count
// people, not money.
//
// Every fixture is 0 / 2 paid. A part-paid request would need a completed card
// payment through Stripe, which this run does not make - see briefs/17.md,
// Unreachable.

import { test, expect } from '@playwright/test';
import {
  shot, quiet17, context17, openRequest, paymentHubReady, fixtures17,
  KB17, KB17_REQUESTS, sidebarIdentity17, participantRows,
} from '../../lib/kb';

test.describe('17.7 Tracking money you have asked for', () => {
  test('the table, the columns, and who has paid', async ({ browser }) => {
    const fx = await fixtures17();
    const mo = await context17(browser, KB17.pro, '/payment');
    try {
      const page = mo.page;
      const subject = KB17_REQUESTS.tracked.title;
      await paymentHubReady(page, subject);

      await shot(page, '17.7', '01-requested-table', {
        mask: [sidebarIdentity17(page, 'Mo KB')],
      });

      // The header row plus the article's subject, so the columns and a real row
      // are legible in one frame.
      const header = page.getByText('Per Person', { exact: true })
        .locator('visible=true').first()
        .locator('xpath=ancestor::div[contains(@class,"grid")][1]');
      await shot(page, '17.7', '02-table-columns', {
        clip: page.locator('main'), annotate: header,
      });

      const details = await openRequest(page, subject);
      const amounts = details.getByText('Per Person', { exact: true })
        .locator('xpath=ancestor::div[2]');
      await shot(page, '17.7', '03-payment-details-amounts', {
        clip: details, clipPad: 8, annotate: amounts,
      });

      // Clipped to the rows themselves: they sit below the window's own fold, so
      // a dialog-wide clip shows the top of the window and none of the people.
      const people = participantRows(details);
      await shot(page, '17.7', '04-participant-statuses', {
        clip: people, clipPad: 12,
      });
      await page.getByRole('button', { name: 'Close' }).first().click();

      // A request raised against a team also sits on that team's PAYMENT tab.
      // A match request does not, which is why the match fee is absent here.
      await page.goto(`/teams/${fx.united}/payment`);
      await paymentHubReady(page, subject);
      await expect(page.getByText(KB17_REQUESTS.payable.title, { exact: true }))
        .toHaveCount(0);
      await quiet17(page);
      await shot(page, '17.7', '05-team-payment-tab', {
        mask: [sidebarIdentity17(page, 'Mo KB')],
      });
    } finally {
      await mo.ctx.close();
    }
  });
});
