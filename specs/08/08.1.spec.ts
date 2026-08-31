// 08.1 - Creating a leaderboard.
//
// Two halves, because the article is flagged free_pro and the two plans do not
// see the same screen at all. On Pro, Create New Leaderboard opens a window with
// two controls. On Free, with one leaderboard already owned, the same control
// opens Leaderboard Limit Reached instead - and no POST is sent, so the reader
// never sees the window.
//
// Every account is born with one leaderboard, so a Free account is at its limit
// from the moment it exists. That is why the Free half needs no setup beyond the
// account existing, and why kb-08-free@ must never be given anything.
//
// Two seeded accounts, never one flipped - docs/style-guide.md, "Actions you can
// only do once". Mo is Pro at rest and Fern is Free at rest.
//
// This is the one spec here that creates something. It creates the throwaway
// KB 08 Friday League to photograph the result, then deletes it in a `finally`:
// three other specs walk past "Your Leaderboards (1)", and a throwaway left
// behind would put a second card on their captures.

import { test, expect } from '@playwright/test';
import {
  shot, quiet08, signInAs, onScreen,
  sidebarIdentity, moving08,
  fixtures08, table08Ready, dropThrowaway08,
  KB08, KB08_LEAGUE, KB08_THROWAWAY,
  leaderboardListReady, leaderboardCard, boardReady08, boardViewsCount, dialog08,
} from '../../lib/kb';

test.describe('08.1 Creating a leaderboard', () => {
  test('Pro: the Create Leaderboard window, and the board it makes', async ({ page }) => {
    const fx = await fixtures08();
    await table08Ready(fx);

    await signInAs(page, KB08.pro, '/leaderboards');
    await quiet08(page);
    await leaderboardListReady(page, 1, [KB08_LEAGUE]);

    const mask = [sidebarIdentity(page, 'Mo KB'), ...moving08(page)];

    try {
      // 01 - where the reader starts. One leaderboard, and the control that makes
      // another. Masked: the "Created on" line moves whenever the seed is rebuilt.
      const create = onScreen(page.getByText('Create New Leaderboard', { exact: true })).first();
      await expect(create).toBeVisible();
      await shot(page, '08.1', '01-leaderboards-list', { annotate: create, mask });

      // 02 - the window, on Pro. Two controls and nothing else: a logo and a
      // name. There is no Leaderboard style field here - that only appears on
      // the onboarding /createLeaderboard step, and it is disabled there too.
      await create.click();
      const dlg = await dialog08(page, 'Create Leaderboard');
      const name = onScreen(dlg.locator('input[name="leaderboardName"]')).first();
      await expect(name).toBeVisible();
      await expect(dlg.getByText('Upload Leaderboard Logo')).toBeVisible();
      await expect(onScreen(dlg.getByRole('button', { name: 'Add', exact: true }))).toBeVisible();
      await shot(page, '08.1', '02-create-window-pro', { clip: dlg, clipPad: 24, annotate: name });

      // 03 - the same window with a name in it. Add is the subject now.
      await name.fill(KB08_THROWAWAY);
      await expect(name).toHaveValue(KB08_THROWAWAY);
      const add = onScreen(dlg.getByRole('button', { name: 'Add', exact: true })).first();
      await shot(page, '08.1', '03-create-window-named', { clip: dlg, clipPad: 24, annotate: add });

      // 04 - the list afterwards. Two cards, the new one badged Owner. Gate on
      // the count in the heading: it paints as (1) until GET /leaderboards
      // lands again.
      await add.click();
      await leaderboardListReady(page, 2, [KB08_LEAGUE, KB08_THROWAWAY]);
      const card = leaderboardCard(page, KB08_THROWAWAY);
      await expect(card.getByText('Owner', { exact: true })).toBeVisible();
      await shot(page, '08.1', '04-list-after-create', { annotate: card, mask });

      // 05 - the board a new leaderboard opens on. Nothing in it yet: 0 Teams
      // joined, and Team Stats reads "No teams data available". That is the shot
      // that tells the reader adding teams is the next thing to do.
      await onScreen(card.getByRole('button', { name: 'Open Board' })).first().click();
      await boardReady08(page, 0, onScreen(page.getByText('No teams data available')).first());
      await quiet08(page);
      await shot(page, '08.1', '05-new-board-empty', {
        mask: [sidebarIdentity(page, 'Mo KB'), boardViewsCount(page), ...moving08(page)],
      });
    } finally {
      // Put Mo back to one leaderboard whether or not the captures got that far.
      await dropThrowaway08(fx);
    }
  });

  test('Free: the same control opens Leaderboard Limit Reached', async ({ page }) => {
    const fx = await fixtures08();
    // Fern must be carrying nothing but the leaderboard she was born with. If a
    // run ever left her a second one the gate would not fire and the capture
    // would document the wrong thing.
    expect(fx.free.membership).toBe('Free');

    await signInAs(page, KB08.free, '/leaderboards');
    await quiet08(page);
    await leaderboardListReady(page, 1, ["Fern's leaderboard"]);

    const mask = [sidebarIdentity(page, 'Fern KB'), ...moving08(page)];

    // 06 - the Free list. One leaderboard, which is already the limit.
    const create = onScreen(page.getByText('Create New Leaderboard', { exact: true })).first();
    await expect(create).toBeVisible();
    await shot(page, '08.1', '06-leaderboards-list-free', { annotate: create, mask });

    // 07 - the gate. Client-side: no POST /leaderboards is sent, so the create
    // window never opens. The wording is the app's own i18n string, not the
    // API's - config/api.md, "The modal does not show the API's wording".
    await create.click();
    const gate = await dialog08(page, 'Leaderboard Limit Reached');
    await expect(gate.getByText(
      'Free plan users can create only 1 leaderboard. Delete your current leaderboard or upgrade to Pro Membership to create another.',
    )).toBeVisible();
    await expect(onScreen(gate.getByRole('button', { name: 'FREE Upgrade (Beta)' }))).toBeVisible();
    // Nothing was created. Asserted rather than assumed: the whole article turns
    // on the gate firing instead of the form.
    await expect(onScreen(page.locator('input[name="leaderboardName"]'))).toHaveCount(0);
    await shot(page, '08.1', '07-limit-modal-free', { clip: gate, clipPad: 24 });
  });
});
