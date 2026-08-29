// 04.1 - Free vs Pro, what is included.
//
// The subject is one screen: /subscriptions, Platform Pro tab. It carries a
// strip naming the plan you are on and two cards listing what each plan gives
// you. The article is a tour of that screen, so the captures are the screen as
// a Free member sees it, the two cards on their own, and the same screen as a
// Pro member sees it.
//
// Two accounts, not one flipped. docs/style-guide.md, "Actions you can only do
// once": a free_pro article gets two seeded accounts, so the two halves do not
// depend on the order the specs run in. `kb-manager-free-04@` is Free and stays
// Free; `kb-04-pro@` is Pro and stays Pro. Neither is upgraded here - that is
// 04.2, on a third account.
//
// The plan content is served from /api/prismic/subscription-plans, so it can
// change without the app changing. Every line is asserted against
// lib/fixtures-04.mjs: if the copy moves, this spec fails rather than quietly
// publishing a screenshot the article's prose no longer describes.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures04, subscriptionsReady, planCard,
  activePlanStrip, hideSidebarIdentity, unstickHeader, KB04,
} from '../../lib/kb';

const ARTICLE = '04.1';

// See the note beside the card captures below.
const CARD_PAD = 18;

test.describe('04.1 Free vs Pro', () => {
  test('the plans screen as a Free member', async ({ page }) => {
    const fx = await fixtures04();

    await signInAs(page, fx.free.email, '/subscriptions');
    await quiet(page);
    await subscriptionsReady(page);
    await hideSidebarIdentity(page, 'Marc KB');

    // The strip names the plan you are on. On Free it reads BASIC, which is what
    // this screen calls the free plan - the rest of the app says Free.
    const strip = activePlanStrip(page);
    await expect(strip).toContainText('BASIC');
    await expect(strip).toContainText('Active');
    await expect(strip).not.toContainText(KB04.CANCEL_SUBSCRIPTION);

    // The whole screen, not the viewport: this article is a tour of it, and the
    // two cards run past the fold. unstickHeader first, or Playwright stitches
    // the sticky header into the middle of the image.
    await unstickHeader(page);
    await shot(page, ARTICLE, '01-plans-page-free', { fullPage: true });

    // Both cards, line by line, against the fixture.
    const basic = planCard(page, 'basic');
    await expect(basic).toContainText(KB04.PLAN_CARDS.basic.title);
    for (const feature of KB04.PLAN_CARDS.basic.features) {
      await expect(basic).toContainText(feature);
    }
    // clipPad: the Pro card's "Most Popular" badge overhangs the card's own box
    // and loses its top half to a clip that hugs it. Both cards are padded by
    // the same amount so the pair reads as a pair.
    await shot(page, ARTICLE, '02-basic-card', { clip: basic, clipPad: CARD_PAD });

    const pro = planCard(page, 'pro');
    await expect(pro).toContainText(KB04.PLAN_CARDS.pro.badge);
    await expect(pro).toContainText(KB04.PLAN_CARDS.pro.priceSuffix);
    for (const feature of KB04.PLAN_CARDS.pro.features) {
      await expect(pro).toContainText(feature);
    }
    // "Many more cool features" is the one line the app marks as not shipped.
    // It is not an exact-text leaf: the "Coming soon" chip is nested inside it.
    await expect(pro).toContainText('Coming soon');
    await expect(pro.getByRole('button', { name: KB04.UPGRADE_BUTTON })).toBeVisible();
    await shot(page, ARTICLE, '03-pro-card', { clip: pro, clipPad: CARD_PAD });
  });

  test('the plans screen as a Pro member', async ({ page }) => {
    const fx = await fixtures04();

    await signInAs(page, fx.pro.email, '/subscriptions');
    await quiet(page);
    await subscriptionsReady(page);
    await hideSidebarIdentity(page, 'Nia KB');

    // Same screen, three differences: the strip names PRO, it offers a way back
    // to Free, and the Pro card's button is spent.
    const strip = activePlanStrip(page);
    // Upper case on screen, mixed case in the DOM - the same text-transform
    // trap collections 14, 01 and 07 hit on GROUP A, DELETE ACCOUNT and the
    // team tabs.
    await expect(strip).toContainText('Pro');
    await expect(strip).toContainText('Beta');
    await expect(strip).toContainText('Active');
    await expect(strip).toContainText(KB04.CANCEL_SUBSCRIPTION);
    await expect(planCard(page, 'pro')).toContainText(KB04.PRO_ACTIVE_BUTTON);
    await expect(page.getByRole('button', { name: KB04.UPGRADE_BUTTON })).toHaveCount(0);

    await unstickHeader(page);
    await shot(page, ARTICLE, '04-plans-page-pro', { fullPage: true });
  });
});
