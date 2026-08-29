// 07.11 - Deleting a team.
//
// Nothing is deleted. The DELETE TEAM card and its confirmation dialog are
// photographed and the dialog is cancelled; KB 07 United is the fixture six
// other articles depend on.
//
// There is no "after" fixture, and that is deliberate rather than a gap: the
// state after deleting a team is a team list without it, which is the list the
// reader already has. The third shot is the role half instead - the same card on
// a team you do not own, where the button is present and disabled.
//
// One account: Mo owns KB 07 United and is an Administrator on KB 07 Wanderers.

import { test, expect } from '@playwright/test';
import {
  shot, quiet07, signInAs, unstickHeader, openDialog, centre,
  fixtures07, teamCard,
  KB07, KB07_TEAMS,
} from '../../lib/kb';

test.describe('07.11 Deleting a team', () => {
  test('the control, the confirmation, and what a member without the role sees', async ({ page }) => {
    const fx = await fixtures07();

    await signInAs(page, KB07.pro, `/teams/${fx.teams.united}/settings`);
    await quiet07(page);
    await expect(page.getByText(`Edit Team - ${KB07_TEAMS.united}`)).toBeVisible();
    await unstickHeader(page);

    // 01 - the card at the foot of the page, and its warning.
    const card = await teamCard(page, 'DELETE TEAM');
    const button = card.getByRole('button', { name: 'Delete Team', exact: true });
    await expect(button).toBeEnabled();
    await expect(card).toContainText('cannot be undone');
    await centre(card);
    await shot(page, '07.11', '01-delete-team-card', { clip: card, annotate: button });

    // 02 - the confirmation. Unlike removing a member, deleting a team IS
    // confirmed - which is worth the reader knowing, because the member menu
    // next to it is not.
    await button.click();
    const dialog = openDialog(page);
    await expect(dialog.getByText(/This action cannot be undone/)).toBeVisible();
    const confirm = dialog.getByRole('button', { name: 'Delete Team', exact: true });
    await shot(page, '07.11', '02-delete-dialog', { clip: dialog, annotate: confirm });

    // Cancelled. Nothing is deleted.
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);

    // 03 - the same card on a team Mo does not own. The section is there and the
    // button is disabled: DELETE /teams/:id answers 403 "Only team Owner can
    // delete team" for an Administrator, so the screen matches the API.
    await page.goto(`/teams/${fx.teams.wanderers}/settings`);
    await quiet07(page);
    await expect(page.getByText(`Edit Team - ${KB07_TEAMS.wanderers}`)).toBeVisible();
    await unstickHeader(page);
    const other = await teamCard(page, 'DELETE TEAM');
    const disabled = other.getByRole('button', { name: 'Delete Team', exact: true });
    await expect(disabled).toBeDisabled();
    await centre(other);
    await shot(page, '07.11', '03-not-the-owner', { clip: other, annotate: disabled });
  });
});
