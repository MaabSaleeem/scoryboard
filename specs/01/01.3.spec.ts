// 01.3 - Resetting your password, and setting one on an invited account.
//
// Four captures, not the five the brief first planned. The fifth was the screen
// an invitation link opens, and it cannot be produced: the link exists only in
// the invitation email, the address it is sent to has no account, and yopmail -
// the inbox every persona in this project uses - began demanding a CAPTCHA
// during this collection's exploration. Completing a CAPTCHA is not something a
// spec may do. The article keeps that half as prose, and the prose is verified:
// the invitation was opened by hand during step 1 and lands on /signin with the
// address already filled in. See briefs/01.md, Unreachable.
//
// The same block is why this spec does not click Reset Password. That form only
// works with the oobCode from the email. What the capture shows is the form
// itself, which is the same form either way - the page renders identically with
// no code, with an invalid one and with a real one, checked all three ways on
// 2026-08-28. What happens after submitting was watched twice by hand during
// step 1: you are signed in and land on the home page, and /passwordUpdated -
// which exists, and reads "Password updated!" - is never rendered.

import { test, expect } from '@playwright/test';
import { shot, quiet01, blockPromos, KB01, KB01_PASSWORD } from '../../lib/kb';

test.describe('01.3 Resetting your password, and setting one on an invited account', () => {
  test('the reset from the sign-in screen to the new-password form', async ({ page }) => {
    await blockPromos(page);

    await page.goto('/signin');
    await expect(page.getByRole('heading', { name: 'Sign in to Scoryboard' })).toBeVisible();
    await quiet01(page);

    const forgot = page.getByText('Forgot password?', { exact: true });
    await shot(page, '01.3', '01-forgot-password-link', { annotate: forgot });

    await forgot.click();
    await page.waitForURL('**/forgotPassword', { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'Forgot password?' })).toBeVisible();
    await quiet01(page);

    await page.locator('input').first().fill(KB01.reset);
    const send = page.getByRole('button', { name: 'Send reset link', exact: true });
    await shot(page, '01.3', '02-forgot-password-form', { annotate: send });

    // Sent for real. The mail cannot be read back, but the app's own
    // confirmation is the next screen and that is what the article shows.
    await send.click();
    await page.waitForURL('**/checkEmail', { timeout: 30_000 });
    await expect(page.getByText('Check Your Email', { exact: true })).toBeVisible();
    await expect(page.getByText(KB01.reset)).toBeVisible();
    await quiet01(page);
    await shot(page, '01.3', '03-check-your-email');

    // The screen that email's link opens. Reached by its own path rather than by
    // following the link, for the reason at the top of this file.
    await page.goto('/resetPassword');
    await page.waitForSelector('input[name="newPassword"]');
    await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
    await quiet01(page);
    await page.fill('input[name="newPassword"]', KB01_PASSWORD as string);
    await page.fill('input[name="confirmPassword"]', KB01_PASSWORD as string);
    const reset = page.getByRole('button', { name: 'Reset Password', exact: true });
    await shot(page, '01.3', '04-reset-password-form', { annotate: reset });

    // Not submitted. Without the code from the email this would fail, and a
    // capture of that failure is not what the article is about.
  });
});
