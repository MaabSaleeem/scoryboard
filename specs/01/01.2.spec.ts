// 01.2 - Signing in, and common sign-in problems.
//
// Reads nothing and writes nothing. It signs the persona in at the end, which
// is a session, not a change to the account.
//
// The two failures are captured before the successful sign-in, because a
// successful sign-in leaves this screen for good.

import { test, expect } from '@playwright/test';
import {
  shot, quiet01, blockPromos, profileHeader, joinedSince, KB01, KB01_PASSWORD,
} from '../../lib/kb';

const CREDENTIAL_ERROR = 'The credential is invalid or has expired.';

test.describe('01.2 Signing in, and common sign-in problems', () => {
  test('the sign-in form, the two errors it gives, and where a good sign-in lands', async ({ page }) => {
    await blockPromos(page);
    await page.goto('/signin');
    await expect(page.getByRole('heading', { name: 'Sign in to Scoryboard' })).toBeVisible();
    await quiet01(page);

    await shot(page, '01.2', '01-sign-in-form');

    const email = page.getByPlaceholder('Email');
    const password = page.getByPlaceholder('Password');
    const login = page.getByRole('button', { name: 'Login', exact: true });

    // A real address with the wrong password. Firebase answers
    // INVALID_LOGIN_CREDENTIALS, and so does an address with no account at all -
    // it does not say which, on purpose. The article says the same.
    await email.fill(KB01.fresh);
    await password.fill('NotTheRightPassword!1');
    await login.click();
    await expect(page.getByText(CREDENTIAL_ERROR)).toBeVisible();
    await shot(page, '01.2', '02-credential-error');

    // Not an address at all. This one is caught in the browser, before Firebase
    // is asked, and gives a different message.
    await email.fill('fresh.at.yopmail');
    await password.fill(KB01_PASSWORD as string);
    await login.click();
    await expect(page.getByText('Email must be valid.')).toBeVisible();
    await shot(page, '01.2', '03-email-not-valid');

    // --- and now a sign-in that works ---------------------------------------
    // Reloaded first: the error line stays on screen until the page reloads.
    await page.goto('/signin');
    await expect(page.getByRole('heading', { name: 'Sign in to Scoryboard' })).toBeVisible();
    await page.getByPlaceholder('Email').fill(KB01.fresh);
    await page.getByPlaceholder('Password').fill(KB01_PASSWORD as string);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await page.waitForURL((u) => !u.pathname.startsWith('/signin'), { timeout: 60_000 });

    await page.goto('/');
    await expect(page.locator('a[href="/teams"]').first()).toBeVisible();
    await quiet01(page);

    // Clipped to the profile header. The rest of the home page carries the
    // TRENDING feed, which is everybody else's activity.
    const header = await profileHeader(page);
    await shot(page, '01.2', '04-signed-in', { clip: header, mask: [joinedSince(page)] });
  });
});
