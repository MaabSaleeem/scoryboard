// 17.5 - Fees: passing them on or absorbing them.
//
// The fee is computed in the browser, not quoted by any endpoint:
//   total = ceil((base + 2% + 20p) / 0.985)
// At a £10 base that is 56p and £10.56. The spec asserts those figures against
// feeBreakdown() in lib/fixtures-17.mjs before photographing them, so a change to
// the formula fails the run instead of publishing a wrong number.
//
// The last two captures are the point of the article: the same two settings seen
// from the payer's side, where the difference is real money.
//
// Nothing is sent.

import { test, expect } from '@playwright/test';
import {
  shot, context17, openRequestForm, formField, feeToggle, paymentTab,
  paymentHubReady, requestRow, fixtures17, feeBreakdown, KB17, KB17_REQUESTS,
  sidebarIdentity17, feeBlock, feeBreakdownBlock, centre,
} from '../../lib/kb';

test.describe('17.5 Fees - passed on or absorbed', () => {
  test('the toggle, the breakdown, and what the payer is charged', async ({ browser }) => {
    await fixtures17();
    const base = KB17_REQUESTS.tracked.basePrice;      // £10
    const { fee, total } = feeBreakdown(base);         // 0.56, 10.56

    const mo = await context17(browser, KB17.pro, '/payment');
    try {
      const page = mo.page;
      await paymentHubReady(page, KB17_REQUESTS.tracked.title);
      await openRequestForm(page);
      await formField(page, 'Set base price').fill(String(base));

      // Pass-through is the default, and the breakdown only exists in that state.
      const toggle = feeToggle(page);
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByText(`£ ${total.toFixed(2)}`)).toBeVisible();
      await expect(page.getByText(`£ ${fee.toFixed(2)}`)).toBeVisible();
      // Clip to the fee block, not the dialog: the block sits below the fold of
      // the dialog's own scroller, so a dialog-wide clip loses the figures.
      await centre(feeBlock(page));
      // clipPad, not a bare clip: the breakdown is exactly as wide as the block,
      // so without a margin the outline either falls outside the frame or lands
      // on top of the figures. 12px of the form around it gives it room.
      await shot(page, '17.5', '01-fee-passed-on', {
        clip: feeBlock(page), clipPad: 12, annotate: feeBreakdownBlock(page),
      });

      // Turning it off hides the breakdown entirely - the organiser is never
      // shown what they will receive. That absence is the subject of the shot.
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
      await expect(page.getByText('Transaction fee', { exact: true })).toHaveCount(0);
      await centre(feeBlock(page));
      await shot(page, '17.5', '02-fee-absorbed', {
        clip: feeBlock(page), clipPad: 12, annotate: toggle,
      });

      const helper = page.getByText(/Recipients will pay the total price/);
      await shot(page, '17.5', '03-fee-helper', {
        clip: feeBlock(page), clipPad: 12, annotate: helper,
      });
      await page.getByRole('button', { name: 'Close' }).first().click();
    } finally {
      await mo.ctx.close();
    }

    // --- what the payer is actually charged ----------------------------------
    const pia = await context17(browser, KB17.player, '/payment');
    try {
      const p = pia.page;
      await paymentTab(p, 'Pay');
      await paymentHubReady(p, KB17_REQUESTS.payable.title);

      // Pass-through: base £10, charged £10.56.
      const passRow = requestRow(p, KB17_REQUESTS.tracked.title)
        .locator('xpath=ancestor::div[contains(@class,"grid")][1]');
      await expect(passRow).toContainText(`£${total.toFixed(2)}`);
      await shot(p, '17.5', '04-payer-total-passed-on', {
        mask: [sidebarIdentity17(p, 'Pia KB')],
        annotate: passRow,
      });

      // Absorbed: base £15, charged £15.00. The fee came out of the payout.
      const absorbed = KB17_REQUESTS.scratch;
      const absorbRow = requestRow(p, absorbed.title)
        .locator('xpath=ancestor::div[contains(@class,"grid")][1]');
      await expect(absorbRow).toContainText(`£${absorbed.basePrice.toFixed(2)}`);
      await shot(p, '17.5', '05-payer-total-absorbed', {
        mask: [sidebarIdentity17(p, 'Pia KB')],
        annotate: absorbRow,
      });
    } finally {
      await pia.ctx.close();
    }
  });
});
