// 12.5 - Adding teams, assigning owners and claiming a team.
//
// Tournament teams are their own thing. "Add Team" does not pick one of your
// existing teams; it creates a new team that belongs to the tournament
// (isTournament: true). That is why the seed's eight teams live on the
// tournament and not in the organiser's team list.
//
// Dialogs are opened and filled but never submitted, so the fixture keeps its
// eight teams and its one invited owner across runs.
//
// tourn_plan: the last shot is the free Tournament Pro allowance panel, which is
// what decides whether a new tournament is Pro or Basic. The Basic side of that
// is collection 16, not this one.

import { test, expect } from '@playwright/test';
import { signIn, quiet, shot, fixtures, headerIdentity, onScreen, tournamentListReady } from '../../lib/kb';

test.describe('12.5 Adding teams and owners', () => {
  test('from an empty participant list to a team with an owner', async ({ page }) => {
    const fx = await fixtures('organiser');

    await signIn(page, 'organiser', `/tournaments/${fx.newCup}/participants`);
    await quiet(page);
    await page.getByText('No teams added yet', { exact: true }).waitFor();
    await shot(page, '12.5', '01-no-teams-added-yet', {
      mask: [headerIdentity(page)],
      annotate: page.getByRole('button', { name: 'Add Team' }),
    });

    await page.getByRole('button', { name: 'Add Team' }).click();
    const dialog = page.getByRole('dialog').filter({ hasText: 'Add Team' });
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder('Name').fill('Deptford Dynamo');
    await shot(page, '12.5', '02-add-one-team', { clip: dialog });

    await dialog.getByRole('button', { name: 'Multiple teams' }).click();
    const list = dialog.locator('textarea[name="teamList"]');
    await list.fill('Deptford Dynamo\nPeckham Park FC\nNew Cross Rovers');
    await expect(dialog.getByText('3 teams ready to add')).toBeVisible();
    await shot(page, '12.5', '03-add-many-teams-one-per-line', { clip: dialog });

    // Not submitted. The populated list comes from the configured fixture.
    await dialog.getByRole('button', { name: 'Close' }).click();

    await page.goto(`/tournaments/${fx.cup}/participants`);
    await quiet(page);
    await page.getByText('List Of All Teams (8)').waitFor();
    await shot(page, '12.5', '04-list-of-all-teams', { mask: [headerIdentity(page)] });

    // The row menu. Open it on a team that has no owner yet: once a team has
    // one, Add Owner is disabled (aria-disabled, cursor-not-allowed) and cannot
    // be clicked. That is worth a line in the article's failure section.
    // KB 12 Reds already carries the seeded owner, so use KB 12 Blues here.
    const blues = page.getByRole('button').filter({ hasText: 'KB 12 Blues' }).first();
    await blues.getByRole('button').last().click();
    const menu = page.getByRole('menu');
    await expect(menu.getByText('Add Owner')).toBeEnabled();
    await shot(page, '12.5', '05-team-row-menu', { mask: [headerIdentity(page)] });

    await menu.getByText('Add Owner').click();
    const owner = page.getByRole('dialog').filter({ hasText: 'Add Owner' });
    await expect(owner).toBeVisible();
    await shot(page, '12.5', '06-add-owner-blank', { clip: owner });

    await owner.getByPlaceholder('Enter name').fill('Tess Owner');
    await owner.getByPlaceholder('Enter email address').fill('tess@example.com');
    await shot(page, '12.5', '07-add-owner-filled', {
      clip: owner,
      annotate: owner.getByRole('button', { name: 'Continue' }),
    });
    // Not submitted. KB 12 Reds already carries a seeded invited owner, and that
    // is the row the "after" shot uses.
    await owner.getByRole('button', { name: 'Close' }).click();

    const redsRow = page.getByRole('button').filter({ hasText: 'KB 12 Reds' }).first();
    await shot(page, '12.5', '08-team-with-an-owner', {
      clip: redsRow,
    });

    // The allowance panel: what decides Pro or Basic for the next tournament.
    await page.goto('/tournaments');
    await quiet(page);
    const allowance = page.getByText('Free Tournament Pro slots remaining');
    await allowance.waitFor();
    // The panel renders before the tournament cards do, and capturing there
    // catches them as grey skeletons. Wait for the list itself to arrive.
    await tournamentListReady(page);

    // The brief masks the remaining count because it drops whenever anyone
    // creates a tournament. The number appears twice - in the sentence and in
    // the badge beside it - so mask both, or half of it is redacted and the
    // other half is not. The heading stays unmasked: it carries the annotation,
    // and the style guide forbids annotating a masked region.
    // The badge is the only element on this page whose whole text is a number.
    const allowanceBadge = onScreen(
      page.locator('main div').filter({ hasText: /^\d+$/ }),
    ).first();
    await shot(page, '12.5', '09-tournament-pro-slots', {
      mask: [
        headerIdentity(page),
        page.getByText(/Your next \d+ tournaments/),
        allowanceBadge,
      ],
      annotate: allowance,
    });
  });
});
