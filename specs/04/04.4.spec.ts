// 04.4 - Tournament Pro: what it is, and the three plans.
//
// Was 16.1 and 16.2. Collection 16 was retired into 04 on 2026-08-29, because
// both products live on the same /subscriptions screen and a reader who lands
// on it needs to be told which is which.
//
// REAL MONEY, and that is exactly why this spec does nothing but read. It opens
// the Tournament Pro tab, photographs the three cards and the currency control,
// and stops. It never selects Start with PRO or Start with ANNUAL - 04.5 does
// that, and stops at the Stripe boundary too.
//
// The account is kb-04-organiser@, which has NO free Tournament Pro slots. An
// account with a grant sees an allowance panel instead of the paywall, and the
// grant has no revoke, so the two cases need two accounts. 04.6 has the other.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, onScreen, fixtures04, tournamentTabReady, tournamentPlanCard,
  hideSidebarIdentity, unstickHeader, KB04,
} from '../../lib/kb';

const ARTICLE = '04.4';
const CARD_PAD = 18;

test.describe('04.4 Tournament Pro plans', () => {
  test('the three plans, and what Basic actually stops you at', async ({ page }) => {
    test.setTimeout(180_000);
    const fx = await fixtures04();

    await signInAs(page, fx.organiser.email, '/subscriptions');
    await quiet(page);
    await tournamentTabReady(page);
    await hideSidebarIdentity(page, 'Ola KB');

    // No allowance panel: this account pays, which is the case the article is
    // about. 04.6 photographs the other one.
    await expect(page.getByText(KB04.FREE_SLOTS_TITLE, { exact: true })).toHaveCount(0);

    await unstickHeader(page);
    await shot(page, ARTICLE, '01-tournament-pro-tab', { fullPage: true });

    const basic = tournamentPlanCard(page, 'basic');
    for (const f of KB04.TOURNAMENT_PLANS.basic.features) await expect(basic).toContainText(f);
    await expect(basic).toContainText(KB04.TOURNAMENT_PLANS.basic.price);
    await shot(page, ARTICLE, '02-basic-card', { clip: basic, clipPad: CARD_PAD });

    const pro = tournamentPlanCard(page, 'pro');
    for (const f of KB04.TOURNAMENT_PLANS.pro.features) await expect(pro).toContainText(f);
    await expect(pro).toContainText(KB04.TOURNAMENT_PLANS.pro.price.GBP);
    // Two of the Pro lines are not shipped yet and the card marks them.
    await expect(pro.getByText('Coming soon', { exact: true })).toHaveCount(2);
    await shot(page, ARTICLE, '03-pro-card', { clip: pro, clipPad: CARD_PAD });

    const annual = tournamentPlanCard(page, 'annual');
    for (const f of KB04.TOURNAMENT_PLANS.annual.features) await expect(annual).toContainText(f);
    await expect(annual).toContainText(KB04.TOURNAMENT_PLANS.annual.price.GBP);
    await expect(annual).toContainText(KB04.TOURNAMENT_PLANS.annual.priceSuffix);
    await shot(page, ARTICLE, '04-annual-card', { clip: annual, clipPad: CARD_PAD });

    // The currency control. Prices are quoted per currency, not converted at
    // checkout, so which one you are on changes the number on the card.
    const currency = onScreen(page.getByRole('button', { name: 'GBP', exact: true })).first();
    await expect(currency).toBeVisible();
    // Padded well past the control itself: on its own it is a 60px pill with no
    // clue where it lives. The margin puts it back above the plan cards.
    await shot(page, ARTICLE, '05-currency-closed', {
      clip: currency, clipPad: 150, annotate: currency,
    });

    // A dropdown MENU, not a select: its items are menuitemradio, not option.
    await currency.click();
    const menu = onScreen(page.getByRole('menu')).first();
    for (const code of ['GBP', 'EUR', 'USD']) {
      await expect(menu.getByRole('menuitemradio', { name: code, exact: true })).toBeVisible();
    }
    await shot(page, ARTICLE, '06-currency-open', { clip: menu, clipPad: 12 });
    await page.keyboard.press('Escape');
  });
});
