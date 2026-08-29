// 04.2 - Pro is free during beta, how to upgrade.
//
// This is the one spec in the collection that changes an account. There is no
// confirmation step on the way to Pro - selecting "Upgrade to PRO" upgrades you
// on the spot and opens a Congratulations window - so docs/style-guide.md's
// "photograph the dialog, do not submit it" has nothing to photograph. The
// article's subject IS the act.
//
// So it runs against `kb-04-upgrade@`, a third account whose only job is to be
// upgraded, and it puts the membership back with the admin API in a `finally` -
// the reset the style guide asks the seed to provide where the app has no undo.
// A crash halfway therefore still leaves a Free account for the next run, and
// the Free and Pro personas the other two articles photograph are never touched.
//
// Going back is the same shape: "Cancel subscription" downgrades on the spot,
// with no confirmation either. That is shown, not performed - the article says
// what it does and the capture points at it.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, onScreen, sidebar, fixtures04, setMembership,
  subscriptionsReady, planCard, activePlanStrip, openDialog, hideSidebarIdentity, KB04,
} from '../../lib/kb';

const ARTICLE = '04.2';

test.describe('04.2 Upgrading to Pro', () => {
  test('from the sidebar to a Pro membership, and the way back', async ({ page }) => {
    test.setTimeout(180_000);
    const fx = await fixtures04();
    expect(fx.upgrade.membership, 'kb-04-upgrade@ must start Free - run node scripts/seed-04.mjs')
      .toBe('Free');

    try {
      await signInAs(page, fx.upgrade.email, '/subscriptions');
      await quiet(page);
      await subscriptionsReady(page);
      await hideSidebarIdentity(page, 'Ubi KB');

      // 1. How you get here. Subscriptions is the last item in the sidebar's
      //    navigation list, on every screen.
      const nav = sidebar(page);
      const subscriptions = nav.locator('a[href="/subscriptions"]');
      await expect(subscriptions).toBeVisible();
      await shot(page, ARTICLE, '01-sidebar-subscriptions', {
        clip: nav, annotate: subscriptions,
      });

      // 2. The button. Pro costs nothing during the beta and the card says so:
      //    FREE (with Beta), no price, no payment step.
      const pro = planCard(page, 'pro');
      const upgrade = pro.getByRole('button', { name: KB04.UPGRADE_BUTTON });
      await expect(upgrade).toBeVisible();
      await shot(page, ARTICLE, '02-upgrade-to-pro', { clip: pro, clipPad: 18, annotate: upgrade });

      // 3. Selecting it upgrades the account. No confirmation, no card details.
      await upgrade.click();
      const congrats = openDialog(page);
      await expect(congrats).toContainText(KB04.CONGRATULATIONS);
      await expect(congrats.getByRole('button', { name: 'Close' }).first()).toBeVisible();
      await shot(page, ARTICLE, '03-congratulations', { clip: congrats, clipPad: 20 });

      await congrats.getByRole('button', { name: 'Close' }).first().click();
      await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);

      // 4. What the screen says afterwards, and the way back out of it.
      const strip = activePlanStrip(page);
      await expect(strip).toContainText('Pro');
      await expect(strip).toContainText('Active');
      const cancel = onScreen(strip.getByText(KB04.CANCEL_SUBSCRIPTION, { exact: true })).first();
      await expect(cancel).toBeVisible();
      await expect(planCard(page, 'pro')).toContainText(KB04.PRO_ACTIVE_BUTTON);
      await shot(page, ARTICLE, '04-plan-now-pro', { clip: strip, annotate: cancel });

      // 5. The sidebar carries the membership too: Subscriptions gains a small
      //    Pro mark, on every screen, so you can tell without opening anything.
      // Clipped to the item itself, not the sidebar: shot 01 already showed
      // where it sits, and the whole sidebar again with one small icon changed
      // reads as the same picture twice. No outline either - at this crop the
      // item IS the subject.
      await expect(subscriptions.locator('svg')).toHaveCount(2);
      await shot(page, ARTICLE, '05-pro-in-the-sidebar', { clip: subscriptions });
    } finally {
      // The app has no undo for an upgrade. This is the reset.
      await setMembership(fx.upgrade.id, 'Free');
    }
  });
});
