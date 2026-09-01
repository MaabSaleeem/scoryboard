// 17.3 - Requesting payment, choosing a source.
//
// Four ways in - the Payment hub, a team, a leaderboard and a match - and three
// sources inside the window: Leaderboards, Teams, Friends.
//
// Two role captures, because only the Owner may ask for money on a team. An
// Administrator and a Player get the Pay sub-tab and nothing else.
//
// Shot 09 is a DEFECT state, on purpose. Select Team reads a persisted Redux
// slice that only /teams fills, so an owner who goes straight to Payment after
// signing in sees "Your Teams (0) / No teams found where you are the owner."
// That capture is the one place in this collection that must NOT call signIn17,
// because signIn17 exists precisely to avoid it.

import { test, expect } from '@playwright/test';
import {
  shot, quiet17, freezeClock17, context17, signInAs, openSourceChooser, chooseSource,
  paymentHubReady, fixtures17, KB17, KB17_TEAMS, KB17_LEADERBOARD, KB17_REQUESTS,
  sidebarIdentity17, publicContext, topDialog, dialogSettled,
} from '../../lib/kb';

test.describe('17.3 Requesting payment - choosing a source', () => {
  test('the three sources, the four ways in, and who may use them', async ({ browser }) => {
    const fx = await fixtures17();

    const mo = await context17(browser, KB17.pro, '/payment');
    try {
      const page = mo.page;
      await paymentHubReady(page, KB17_REQUESTS.tracked.title);

      await shot(page, '17.3', '01-request-payment-button', {
        mask: [sidebarIdentity17(page, 'Mo KB')],
        annotate: page.getByRole('button', { name: 'Request Payment', exact: true }).first(),
      });

      await openSourceChooser(page);
      const chooser = topDialog(page);
      await shot(page, '17.3', '02-source-chooser', { clip: chooser, clipPad: 8 });

      // Teams
      await chooseSource(page, 'teams');
      await expect(page.getByRole('heading', { name: 'Select Team' })).toBeVisible();
      await expect(page.getByText('Your Teams (2)')).toBeVisible();
      await dialogSettled(page, KB17_TEAMS.united);
      await shot(page, '17.3', '03-select-team', {
        clip: chooser,
        clipPad: 8,
        annotate: page.getByText(KB17_TEAMS.united, { exact: true }).locator('visible=true').first(),
      });
      await page.getByRole('button', { name: 'Close' }).first().click();
      await expect(chooser).toBeHidden();

      // Leaderboards
      await openSourceChooser(page);
      const chooser2 = topDialog(page);
      await chooseSource(page, 'leaderboards');
      await expect(page.getByRole('heading', { name: 'Select Leaderboard' })).toBeVisible();
      await dialogSettled(page, KB17_LEADERBOARD);
      await shot(page, '17.3', '04-select-leaderboard', { clip: chooser2, clipPad: 8 });
      await page.getByRole('button', { name: 'Close' }).first().click();
      await expect(chooser2).toBeHidden();

      // Friends
      await openSourceChooser(page);
      const chooser3 = topDialog(page);
      await chooseSource(page, 'friends');
      await expect(page.getByRole('heading', { name: 'Select Friends' })).toBeVisible();
      // The list is fetched after the window is on screen. Gate on a row, not on
      // the heading: the first run photographed six skeletons.
      await dialogSettled(page, 'Femi KB');
      await shot(page, '17.3', '05-select-friends', { clip: chooser3, clipPad: 8 });
      await page.getByRole('button', { name: 'Close' }).first().click();

      // --- the team page, as the Owner --------------------------------------
      await page.goto(`/teams/${fx.united}/payment`);
      await paymentHubReady(page, KB17_REQUESTS.tracked.title);
      await quiet17(page);
      await shot(page, '17.3', '06-team-payment-owner', {
        mask: [sidebarIdentity17(page, 'Mo KB')],
        annotate: page.getByRole('button', { name: 'Request Payment', exact: true }).first(),
      });

      // --- the match panel ----------------------------------------------------
      await page.goto(`/matches/${fx.match}`);
      const panel = page.locator('#payment');
      await panel.scrollIntoViewIfNeeded();
      await expect(page.getByText('You can only see your own payment details.')).toBeVisible();
      // The panel opens on its Pay sub-tab, which for the owner reads "No
      // payments found." and says nothing about requesting. Show Requests, where
      // the match's own request actually is.
      await panel.getByText('Requests', { exact: true }).click();
      await expect(panel.getByText(KB17_REQUESTS.payable.title, { exact: true })
        .locator('visible=true').first()).toBeVisible({ timeout: 30_000 });
      await quiet17(page);
      await shot(page, '17.3', '08-match-payment-panel', {
        clip: panel,
        annotate: panel.getByRole('button', { name: 'Request Payment', exact: true }).first(),
      });
    } finally {
      await mo.ctx.close();
    }

    // --- the same team page, as an Administrator -----------------------------
    const ada = await context17(browser, KB17.admin, `/teams/${fx.united}/payment`);
    try {
      await expect(ada.page.getByRole('tab', { name: 'Pay', exact: true })).toBeVisible();
      await expect(ada.page.getByRole('button', { name: 'Request Payment', exact: true }))
        .toHaveCount(0);
      // The panel paints skeletons before its own fetch lands. Gate on a request
      // Ada can actually see: she is a participant, so her Pay list is not empty.
      await dialogSettled(ada.page, KB17_REQUESTS.tracked.title);
      const strip = ada.page.getByRole('tab', { name: 'Pay', exact: true })
        .locator('xpath=ancestor::div[.//*[@role="tab"]][1]');
      await shot(ada.page, '17.3', '07-team-payment-admin', {
        mask: [sidebarIdentity17(ada.page, 'Ada KB')],
        annotate: strip,
      });
    } finally {
      await ada.ctx.close();
    }

    // --- the defect state ----------------------------------------------------
    // Deliberately NOT signIn17: this is what a reader sees when they go straight
    // to Payment without opening Teams first.
    const cold = await publicContext(browser);
    const page = await cold.newPage();
    try {
      await signInAs(page, KB17.pro, '/payment');
      await freezeClock17(page);
      await quiet17(page);
      await paymentHubReady(page, KB17_REQUESTS.tracked.title);
      await openSourceChooser(page);
      await chooseSource(page, 'teams');
      await expect(page.getByText('No teams found where you are the owner.')).toBeVisible();
      await shot(page, '17.3', '09-select-team-empty', { clip: topDialog(page), clipPad: 8 });
    } finally {
      await cold.close();
    }
  });
});
