// 04.5 - Upgrading a tournament to Tournament Pro.
//
// Was 16.3 and 16.4. REAL MONEY, and this spec spends none of it.
//
// --- where the captures stop, and why ---------------------------------------
//
// Two controls end the Scoryboard part of this flow, and neither is selected
// here:
//
//   * "Continue with PRO" posts to /tournaments/:id/billing/checkout-session
//     and hands off to Stripe;
//   * "Start with ANNUAL" opens a Stripe `embedded-checkout` iframe in place.
//     The panel around it is Scoryboard's - "Back to plans", "Tournament Pro",
//     "All upgrades are subject to our terms of use." - and everything inside it
//     is Stripe. Confirmed by reading the frame list on staging, 2026-08-29.
//
// So the last screen this article photographs is the "Choose a Tournament for
// PRO" dialog with a tournament picked and the way on pointed at. What happens
// after that is described in prose. Nothing here enters a card number, and
// nothing here creates a checkout session.
//
// The empty state is worth its own capture: it is what a reader sees if they
// try to buy Pro before making a tournament, and the wording tells them so.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, onScreen, openDialog, fixtures04, tournamentTabReady,
  tournamentPlanCard, hideSidebarIdentity, KB04,
} from '../../lib/kb';

const ARTICLE = '04.5';
const PAD = 20;

test.describe('04.5 Upgrading a tournament', () => {
  test('from the Pro card to the last screen before checkout', async ({ page }) => {
    test.setTimeout(240_000);
    const fx = await fixtures04();

    await signInAs(page, fx.organiser.email, '/subscriptions');
    await quiet(page);
    await tournamentTabReady(page);
    await hideSidebarIdentity(page, 'Ola KB');

    // 1. The Pro card, and the button that starts it.
    const pro = tournamentPlanCard(page, 'pro');
    const start = pro.getByRole('button', { name: KB04.TOURNAMENT_PLANS.pro.button, exact: true });
    await expect(start).toBeVisible();
    await shot(page, ARTICLE, '01-start-with-pro', { clip: pro, clipPad: 18, annotate: start });

    // 2. Pro is bought for ONE tournament, so the next thing it asks is which.
    await start.click();
    const dialog = openDialog(page);
    await expect(dialog).toContainText(KB04.PRO_SELECTOR_TITLE);
    const row = dialog.getByText(fx.tournament.name, { exact: true });
    await expect(row.first()).toBeVisible();
    // Upper case on screen, "Basic tournament" in the DOM - the same
    // text-transform trap as the active-plan strip in 04.1.
    await expect(dialog).toContainText('Basic tournament');
    await shot(page, ARTICLE, '02-choose-a-tournament', {
      clip: dialog,
      clipPad: PAD,
      // "Created on 29/08/2026" is the fixture's own creation date and moves
      // whenever the seed rebuilds it. It is not what this capture is about.
      mask: [dialog.getByText(/^Created on/)],
    });

    // 3. Pick it. The way on is Continue with PRO - and that is the last thing
    //    Scoryboard shows you. Selecting it hands off to Stripe, so the spec
    //    points at it and stops.
    await row.first().click();
    const continueBtn = dialog.getByRole('button', {
      name: KB04.PRO_SELECTOR_CONTINUE, exact: true,
    });
    await expect(continueBtn).toBeVisible();
    await shot(page, ARTICLE, '03-continue-with-pro', {
      clip: dialog,
      clipPad: PAD,
      annotate: continueBtn,
      mask: [dialog.getByText(/^Created on/)],
    });

    // NOT clicked. See the header of this file.
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);

    // 4. The Annual card. Annual covers every tournament for a year rather than
    //    one, and it is bought from the card itself - there is nothing to pick.
    const annual = tournamentPlanCard(page, 'annual');
    const startAnnual = annual.getByRole('button', {
      name: KB04.TOURNAMENT_PLANS.annual.button, exact: true,
    });
    await expect(startAnnual).toBeVisible();
    await shot(page, ARTICLE, '04-start-with-annual', {
      clip: annual, clipPad: 18, annotate: startAnnual,
    });
    // Also not clicked: it opens the Stripe checkout in place.
  });

  test('what you see with no Basic tournament to upgrade', async ({ page }) => {
    test.setTimeout(180_000);
    const fx = await fixtures04();

    // The grant account owns no tournaments, which is the state this capture
    // needs. Its free slots do not change the empty state - the dialog still
    // asks you to make a tournament first.
    await signInAs(page, fx.grant.email, '/subscriptions');
    await quiet(page);
    await tournamentTabReady(page);
    await hideSidebarIdentity(page, 'Gia KB');

    await tournamentPlanCard(page, 'pro')
      .getByRole('button', { name: KB04.TOURNAMENT_PLANS.pro.button, exact: true })
      .click();

    const dialog = openDialog(page);
    await expect(dialog).toContainText(KB04.PRO_SELECTOR_EMPTY);
    await expect(dialog).toContainText('Create a tournament to continue');
    await expect(dialog.getByRole('button', { name: 'New Tournament', exact: true }))
      .toBeVisible();
    await shot(page, ARTICLE, '05-no-basic-tournaments', { clip: dialog, clipPad: PAD });

    await page.keyboard.press('Escape');
  });
});
