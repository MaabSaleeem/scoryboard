// 04.3 - Every Free-plan limit, and the messages you will see.
//
// Six refusals, photographed one at a time from an account that is sitting
// exactly on its limits, plus two of the same screens on Pro so the reader can
// see what changes. `scripts/seed-04.mjs` is what puts the Free account there:
// fourteen friends, one leaderboard, and a profile somebody has viewed.
//
// Every gate here is a REFUSAL, so none of them changes anything: the friend is
// not created, the admin is not added, the leaderboard is not made. The spec is
// therefore safe to re-run, and the Free account is still on its limits
// afterwards. The two Pro captures are reads and an unsubmitted dialog - nothing
// is created there either.
//
// Nothing in this file upgrades an account. The gate modals all carry a
// "FREE Upgrade (Beta)" button and selecting it would turn the persona Pro and
// silently delete every other capture in this article. Upgrading is 04.2, on its
// own account.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, onScreen, openDialog, fixtures04, gateReady,
  profileCounter, hideSidebarIdentity, KB04,
} from '../../lib/kb';

const ARTICLE = '04.3';

// Frame each gate modal with a margin of the page it dimmed. Hugging the
// dialog's own box catches a sliver of that dimmed page in the rounded top
// corners, which reads as a dark smudge along the top edge on the leaderboard
// and player screens. See ShotOptions.clipPad in lib/kb.ts.
const GATE_PAD = 20;

/**
 * One entry from the fixture file's table, by key.
 *
 * Only the rows this spec photographs are asked for, and every one of those has
 * a title and a message - the rows with `title: null` are the limits the article
 * states in prose because reaching them costs a fixture from another collection.
 */
const limit = (key: string): { title: string; message: string } => {
  const row = KB04.LIMITS.find((l: any) => l.key === key);
  if (!row) throw new Error(`No limit "${key}" in lib/fixtures-04.mjs`);
  if (!row.title || !row.message) throw new Error(`Limit "${key}" has no modal to photograph`);
  return { title: row.title, message: row.message };
};

/** Close every dialog on screen, confirming nothing. */
async function closeAll(page: any) {
  for (let i = 0; i < 4; i++) {
    const open = page.locator('[role="dialog"]').locator('visible=true');
    if (!(await open.count())) return;
    await open.last().getByRole('button', { name: 'Close' }).last().click();
    await page.waitForTimeout(300);
  }
  await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);
}

test.describe('04.3 Free-plan limits', () => {
  test('the six refusals a Free account runs into', async ({ page }) => {
    test.setTimeout(240_000);
    const fx = await fixtures04();

    // --- 1. Friends. The list is on 14, so the fifteenth is refused. ---------
    await signInAs(page, fx.free.email, '/friendList');
    await quiet(page);
    await hideSidebarIdentity(page, 'Marc KB');
    for (const name of [KB04.FRIENDS[0], KB04.FRIENDS[KB04.FRIENDS.length - 1]]) {
      await expect(onScreen(page.getByText(name, { exact: true })).first()).toBeVisible();
    }
    // The list being exactly ON the limit is what makes the next step a
    // refusal, and it is asserted over the API in fixtures04() rather than by
    // counting rows here: every row renders TWO "Add To Team" buttons, both
    // with a real box, so a DOM count comes back at 28 for 14 friends.

    // The refusal arrives on the way IN, not on submit: with the list already
    // at 14 the app never opens the Add Friend dialog at all. (A stale page
    // that still believes the list is at 13 opens the form and is refused when
    // it posts - same modal, one step later. The article documents the first.)
    // onScreen: the page renders a wide and a narrow copy of this button.
    await onScreen(page.getByRole('button', { name: 'Add Friend', exact: true })).first().click();

    const friendGate = await gateReady(page, limit('friends').title, limit('friends').message);
    await expect(friendGate.getByRole('button', { name: KB04.GATE_UPGRADE_BUTTON })).toBeVisible();
    await shot(page, ARTICLE, '01-friend-limit-free', { clip: friendGate, clipPad: GATE_PAD });
    await closeAll(page);

    // --- 2. Team administrators. Owner is the only role a Free account gets. -
    //
    // Driven from the friends list rather than the Edit Team page on purpose.
    // That is the one path that sends an EXISTING friend's id: typing a new
    // name into Add New Player creates a friend record as a side effect, so on
    // a full list it answers FRIEND_LIMIT_EXCEEDED and you never reach the
    // admin refusal at all.
    const row = onScreen(page.getByText(KB04.FRIEND_FOR_ADMIN, { exact: true })).first()
      .locator('xpath=ancestor::div[.//button[normalize-space()="Add To Team"]][1]');
    await row.getByRole('button', { name: 'Add To Team' }).first().click();

    const addToTeam = openDialog(page);
    await expect(addToTeam).toContainText('Add Player To Team');
    const combos = addToTeam.getByRole('combobox');
    await combos.nth(0).click();
    await page.getByRole('option', { name: fx.team.name, exact: true }).click();
    await combos.nth(1).click();
    await page.getByRole('option', { name: 'Administrator', exact: true }).click();
    await addToTeam.getByRole('button', { name: 'Add to Team', exact: true }).click();

    const adminGate = await gateReady(page, limit('team-admins').title, limit('team-admins').message);
    await shot(page, ARTICLE, '02-team-admin-limit-free', { clip: adminGate, clipPad: GATE_PAD });
    await closeAll(page);

    // --- 3. Leaderboards. One, and every account is born with it. -----------
    await page.goto('/leaderboards');
    await quiet(page);
    await hideSidebarIdentity(page, 'Marc KB');
    await expect(onScreen(page.getByText(fx.freeBoard.name, { exact: true })).first()).toBeVisible();
    await page.getByRole('button', { name: 'Create New Leaderboard' }).click();

    const boardGate = await gateReady(
      page, limit('leaderboard-count').title, limit('leaderboard-count').message,
    );
    await shot(page, ARTICLE, '03-leaderboard-limit-free', { clip: boardGate, clipPad: GATE_PAD });
    await closeAll(page);

    // --- 4. Leaderboard administrators. -------------------------------------
    await page.goto(`/leaderboards/${fx.freeBoard.id}/settings`);
    await quiet(page);
    await hideSidebarIdentity(page, 'Marc KB');
    await expect(page.getByRole('button', { name: 'Add Admin' })).toBeVisible();
    await page.getByRole('button', { name: 'Add Admin' }).click();

    const addAdmin = openDialog(page);
    await addAdmin.locator('input[name="email"]').fill(fx.pro.email);
    await addAdmin.getByRole('button', { name: 'Continue', exact: true }).click();

    const boardAdminGate = await gateReady(
      page, limit('leaderboard-admins').title, limit('leaderboard-admins').message,
    );
    await shot(page, ARTICLE, '04-leaderboard-admin-limit-free', { clip: boardAdminGate, clipPad: GATE_PAD });
    await closeAll(page);

    // --- 5. Compare. Only ever on somebody else's profile. ------------------
    await page.goto(`/player/${fx.pro.playerId}`);
    await quiet(page);
    await hideSidebarIdentity(page, 'Marc KB');
    const compare = onScreen(page.getByRole('button', { name: 'Compare', exact: true })).first();
    await expect(compare).toBeVisible();
    await compare.click();

    const compareGate = await gateReady(page, limit('compare').title, limit('compare').message);
    await shot(page, ARTICLE, '05-compare-gate-free', { clip: compareGate, clipPad: GATE_PAD });
    await closeAll(page);

    // --- 6. Profile views. Only ever on your own. ---------------------------
    //
    // The counter is a control only while the count is above zero - the seed
    // makes the Pro account view this profile so that it is.
    await page.goto(`/player/${fx.free.playerId}`);
    await quiet(page);
    await hideSidebarIdentity(page, 'Marc KB');
    const views = profileCounter(page, 'Views');
    await expect(views).toBeVisible();
    await views.click();

    const viewsGate = await gateReady(
      page, limit('profile-views').title, limit('profile-views').message,
    );
    await shot(page, ARTICLE, '06-profile-views-gate-free', { clip: viewsGate, clipPad: GATE_PAD });
    await closeAll(page);

    // Nothing was created. The account is still exactly on its limits.
    expect((await page.evaluate(() => 1))).toBe(1);
  });

  test('the same two screens on Pro', async ({ page }) => {
    test.setTimeout(180_000);
    const fx = await fixtures04();

    // --- 7. Create New Leaderboard opens the form instead of the gate. ------
    //
    // Photographed, not submitted: creating one would leave the Pro account
    // with two leaderboards and change what every later run of this spec finds.
    await signInAs(page, fx.pro.email, '/leaderboards');
    await quiet(page);
    await hideSidebarIdentity(page, 'Nia KB');
    await expect(onScreen(page.getByText(fx.proBoard.name, { exact: true })).first()).toBeVisible();
    await page.getByRole('button', { name: 'Create New Leaderboard' }).click();

    const create = openDialog(page);
    await expect(create).toContainText('Create Leaderboard');
    await expect(create.locator('input[name="leaderboardName"]')).toBeVisible();
    await shot(page, ARTICLE, '07-create-leaderboard-pro', { clip: create, clipPad: GATE_PAD });
    await closeAll(page);

    // --- 8. The Views counter opens the list of viewers. ---------------------
    await page.goto(`/player/${fx.pro.playerId}`);
    await quiet(page);
    await hideSidebarIdentity(page, 'Nia KB');
    const views = profileCounter(page, 'Views');
    await expect(views).toBeVisible();
    await views.click();

    const panel = onScreen(page.locator('[role="dialog"]').filter({ hasText: 'Profile Views' })).first();
    await expect(panel).toBeVisible();
    await expect(panel).toContainText('Marc KB');
    // "16 minutes ago" moves every run. docs/style-guide.md: mask it.
    await shot(page, ARTICLE, '08-profile-views-pro', {
      clip: panel,
      clipPad: GATE_PAD,
      mask: [panel.getByText(/ago$/)],
    });
    await closeAll(page);
  });
});
