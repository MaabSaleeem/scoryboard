// 01.7 - Deleting your account, and why an account may be disabled.
//
// The only destructive spec in the collection, so it rebuilds what it destroys:
// the account is recreated with POST /admins/users at the end, which is exactly
// how scripts/seed-01.mjs makes it.
//
// Signed in with a minted token rather than a password. kb-01-delete@ has no
// password, and none of these captures show the Profile settings panel that
// tells a token-signed-in reader "You signed in with Unknown" - the delete panel
// sits below it and is clipped on its own.
//
// The article's second half cannot be photographed. "This user account has been
// disabled." comes from Firebase's auth/user-disabled, no endpoint on staging
// reaches that state, and the web app never reads the `isDisabled` field it
// stores. The article quotes the message and says to contact support. See
// briefs/01.md, Unreachable.

import { test, expect } from '@playwright/test';
import {
  shot, quiet01, blockPromos, signInAs, unstickHeader, openDialog, onScreen,
  recreateDoomed01, deleteAccount, KB01, KB01_PASSWORD,
} from '../../lib/kb';

const CREDENTIAL_ERROR = 'The credential is invalid or has expired.';

test.describe('01.7 Deleting your account, and why an account may be disabled', () => {
  test('the delete panel, its confirmation, and what the address does afterwards', async ({ page }) => {
    // Assert the precondition rather than assume it: a run that died after the
    // deletion leaves nothing to delete.
    await recreateDoomed01();

    await blockPromos(page);
    await signInAs(page, KB01.doomed, '/profile-settings');
    // The section heading reads DELETE ACCOUNT on screen but its text is
    // "Delete Account" - the capitals are a CSS text-transform, the same trap
    // collection 14 hit on GROUP A and BULK MATCH UPDATE. Matched by role so it
    // is not confused with the button of the same name.
    const heading = page.getByRole('heading', { name: 'Delete Account', exact: true });
    await expect(heading).toBeVisible();
    await quiet01(page);
    await unstickHeader(page);

    const panel = heading.locator('xpath=ancestor::div[contains(@class,"bg-white")][1]');
    await expect(panel.getByRole('button', { name: 'Delete Account', exact: true })).toBeVisible();
    const button = panel.getByRole('button', { name: 'Delete Account', exact: true });
    await shot(page, '01.7', '01-delete-account-panel', { clip: panel, annotate: button });

    await button.click();
    const dialog = openDialog(page);
    await expect(dialog.getByText(/This action cannot be undone/)).toBeVisible();
    const confirm = dialog.getByRole('button', { name: 'Delete Account', exact: true });
    await shot(page, '01.7', '02-delete-account-dialog', { clip: dialog, annotate: confirm });

    // Confirmed. There is no undo, which is why this spec owns an account
    // nothing else uses.
    await confirm.click();
    await page.waitForURL('**/signin**', { timeout: 60_000 });
    await expect(page.getByRole('heading', { name: 'Sign in to Scoryboard' })).toBeVisible();
    await quiet01(page);
    await shot(page, '01.7', '03-signed-out');

    // And now the address behaves like an address that never existed. Firebase
    // gives the same answer for a deleted account as for a wrong password, which
    // is the point of this capture.
    await page.getByPlaceholder('Email').fill(KB01.doomed);
    await page.getByPlaceholder('Password').fill(KB01_PASSWORD as string);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await expect(page.getByText(CREDENTIAL_ERROR)).toBeVisible();
    await shot(page, '01.7', '04-credential-error');

    // Put the fixture back, the way the seed makes it. Clear first, in case the
    // deletion left a Firebase user behind.
    await deleteAccount(KB01.doomed, KB01_PASSWORD);
    await recreateDoomed01();
  });
});
