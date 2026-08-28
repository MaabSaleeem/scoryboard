// 01.5 - Setting up your first team and leaderboard.
//
// The only spec in this collection that writes fixtures, so it is the only one
// that has to clean up. It calls restoreFresh01() at BOTH ends: a run that died
// halfway leaves a leaderboard behind, and a Free account may hold exactly one -
// which would make the next run open "Leaderboard Limit Reached" instead of the
// create form this article is about.
//
// Two things the article has to say up front, both found by looking rather than
// assuming:
//   * the Teams screen is never empty. POST /users creates "Fresh K FC" and
//     "Fresh K FC Away" for every new account.
//   * Team size looks like it defaults to 5 VS 5. It does not - that is
//     placeholder text, and submitting without choosing gives "This field is
//     required."

import { test, expect } from '@playwright/test';
import {
  shot, quiet01, blockPromos, signInWithPassword, fresh01, restoreFresh01,
  openDialog, onScreen, createdOn, KB01,
} from '../../lib/kb';

const TEAM = 'KB 01 Sunday FC';
const TEAM_SIZE = '7 VS 7';
const LEADERBOARD = 'KB 01 Sunday League';

test.describe('01.5 Setting up your first team and leaderboard', () => {
  test('adding a team, and creating the first leaderboard', async ({ page }) => {
    const fx = await fresh01();
    await restoreFresh01(fx.token);

    await blockPromos(page);
    await signInWithPassword(page, KB01.fresh, '/teams');
    await expect(onScreen(page.getByText('Manage Teams', { exact: true })).first()).toBeVisible();
    await quiet01(page);

    // --- the team -----------------------------------------------------------
    const addTeam = page.getByRole('button', { name: 'Add Team', exact: true });
    await shot(page, '01.5', '01-teams-list', { annotate: addTeam });

    await addTeam.click();
    const dialog = openDialog(page);
    await expect(dialog.getByText('Add Team', { exact: true })).toBeVisible();
    await shot(page, '01.5', '02-add-team-dialog', { clip: dialog });

    await dialog.locator('input[name="name"]').fill(TEAM);
    await dialog.locator('button[role="combobox"]').click();
    await expect(page.getByRole('option', { name: '11 VS 11', exact: true })).toBeVisible();
    // Viewport, not clipped to the dialog. The list is portalled outside the
    // dialog and opens upwards over it, so a clip to the dialog is a floating
    // list on top of a blank box - the heading and the name just typed are both
    // behind it. Caught by looking at the first run.
    await shot(page, '01.5', '03-add-team-size-list');

    await page.getByRole('option', { name: TEAM_SIZE, exact: true }).click();
    const add = dialog.getByRole('button', { name: 'Add', exact: true });
    await shot(page, '01.5', '04-add-team-filled', { clip: dialog, annotate: add });

    await add.click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);
    await expect(onScreen(page.getByText(TEAM, { exact: true })).first()).toBeVisible();

    // Reloaded before the capture. The row the dialog adds goes in without its
    // Leaderboards, Matches and Members counts - they arrive with the next fetch
    // of /teams - so a shot taken straight after Add shows one row with three
    // blank columns beside two that are filled in.
    await page.reload();
    await expect(onScreen(page.getByText('Manage Teams', { exact: true })).first()).toBeVisible();
    await expect(onScreen(page.getByText(TEAM, { exact: true })).first()).toBeVisible();
    await expect(onScreen(page.getByText(TEAM_SIZE, { exact: true })).first()).toBeVisible();
    await quiet01(page);
    await shot(page, '01.5', '05-team-created');

    // --- the leaderboard ----------------------------------------------------
    await page.goto('/leaderboards');
    await expect(onScreen(page.getByText('No leaderboard found', { exact: true })).first()).toBeVisible();
    await quiet01(page);
    const create = page.getByRole('button', { name: 'Create New Leaderboard', exact: true }).first();
    await shot(page, '01.5', '06-leaderboards-empty', { annotate: create });

    await create.click();
    const boardDialog = openDialog(page);
    await expect(boardDialog.getByText('Create Leaderboard', { exact: true })).toBeVisible();
    // input[name="leaderboardName"], not "name" - the two dialogs do not share
    // the field name.
    await boardDialog.locator('input[name="leaderboardName"]').fill(LEADERBOARD);
    const addBoard = boardDialog.getByRole('button', { name: 'Add', exact: true });
    await shot(page, '01.5', '07-create-leaderboard-dialog', { clip: boardDialog, annotate: addBoard });

    await addBoard.click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);
    await expect(onScreen(page.getByText(LEADERBOARD, { exact: true })).first()).toBeVisible();
    await expect(onScreen(page.getByText('Your Leaderboards (1)', { exact: true })).first()).toBeVisible();
    // The card carries "Created on <today>", which differs every run.
    await shot(page, '01.5', '08-leaderboard-created', { mask: [createdOn(page)] });

    // Put the account back. Without this the next run finds a leaderboard and
    // the Free limit stops the create form from ever opening.
    await restoreFresh01(fx.token);
  });
});
