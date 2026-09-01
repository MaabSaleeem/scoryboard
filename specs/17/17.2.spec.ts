// 17.2 - Setting up your payout account.
//
// STOPS AT THE HANDOFF. Pressing "Add information" opens a new browser window at
// connect.stripe.com, and on instruction for this run no capture crosses that
// line. The last Scoryboard screen is photographed; what happens inside Stripe is
// prose. Same rule collection 04 followed for Tournament Pro.
//
// Runs on kb-17-nopayout@, the only account that still has no payout account.
// Pressing Request Payment creates a Stripe account row as a side effect and
// there is no way to remove it - that is harmless and repeatable, because the
// page renders identically whether the status is null or Pending. What must
// never happen is somebody finishing Stripe's onboarding on this account: it
// would consume the fixture for good. See lib/fixtures-17.mjs.
//
// The "Setting up your secure account..." state is real but lasts about a second.
// The spec holds POST /payments/stripe/account open to photograph it. That is a
// condition encoded in the spec, not a hand-made capture, so it replays.

import { test, expect } from '@playwright/test';
import {
  shot, quiet17, context17, openSourceChooser, paymentHubReady,
  KB17, KB17_REQUESTS, sidebarIdentity17, fixtures17,
} from '../../lib/kb';

test.describe('17.2 Setting up your payout account', () => {
  test('the way in, and how to tell it worked', async ({ browser }) => {
    // fixtures17() asserts Mo's payout account is live, which the last capture
    // depends on. It fails loudly rather than photographing the wrong screen.
    await fixtures17();

    const nils = await context17(browser, KB17.nopayout, '/payment');
    try {
      const page = nils.page;
      await expect(page.getByRole('heading', { name: 'Get started with payments' })).toBeVisible();

      const stepOne = page.getByText('Setup Your Account', { exact: true })
        .locator('xpath=ancestor::div[contains(@class,"rounded")][1]');
      await shot(page, '17.2', '01-payment-step-one', {
        mask: [sidebarIdentity17(page, 'Nils KB')],
        annotate: stepOne,
      });

      const button = page.getByRole('button', { name: 'Request Payment', exact: true }).first();
      await shot(page, '17.2', '02-request-payment-button', {
        mask: [sidebarIdentity17(page, 'Nils KB')],
        annotate: button,
      });

      // Hold the account call open so the state that follows the click is on
      // screen long enough to photograph. Never a waitForTimeout in the assert:
      // the capture waits for the text, not for a duration.
      await page.route('**/payments/stripe/account', async (route) => {
        if (route.request().method() !== 'POST') return route.continue();
        await new Promise((r) => setTimeout(r, 8000));
        await route.continue();
      });
      await button.click();
      const creating = page.getByText('Setting up your secure account...', { exact: true });
      await expect(creating).toBeVisible({ timeout: 20_000 });
      await shot(page, '17.2', '03-setting-up-account', {
        mask: [sidebarIdentity17(page, 'Nils KB')],
        annotate: creating,
      });
      await page.unroute('**/payments/stripe/account');
      // STOP. The next thing on screen is Stripe's, and nothing past this point
      // is captured.
    } finally {
      await nils.ctx.close();
    }

    // --- how the reader knows it worked --------------------------------------
    // On an account whose payout account is live, Request Payment opens the
    // request flow instead of Stripe. That is the check the article gives, and
    // it is the reason the article does not tell anyone to trust the app's
    // "You're all set to receive payments!" message - see briefs/17.md.
    const mo = await context17(browser, KB17.pro, '/payment');
    try {
      await paymentHubReady(mo.page, KB17_REQUESTS.tracked.title);
      const chooser = await openSourceChooser(mo.page);
      await quiet17(mo.page);
      await shot(mo.page, '17.2', '04-payout-live-source-chooser', {
        clip: chooser,
        clipPad: 8,
      });
    } finally {
      await mo.ctx.close();
    }
  });
});
