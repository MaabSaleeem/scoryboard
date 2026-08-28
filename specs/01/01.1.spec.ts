// 01.1 - Creating your Scoryboard account.
//
// Email and password only. Google and Apple get a sentence each in the article
// and no provider screenshots, so nothing here touches either button.
//
// The article ends at the screen asking for the six-digit code. This spec never
// types the code and never verifies the address: kb-01-signup@ is left
// unverified on purpose, which is also why it can be deleted and signed up again
// on the next run.
//
// It has to pass through Step 1 to get there. Signing up lands on Personal
// information, and the code screen only opens once Step 1 has been submitted -
// POST /users, then POST /users/verify-email/request. There is no shorter path
// to the screen this article is about. 01.4 is the article about the step
// itself; this one shows it twice and moves on.

import { test, expect } from '@playwright/test';
import {
  shot, quiet01, blockPromos, deleteAccount, fillPersonalInfo, resendCountdown, authCard, unstickHeader,
  KB01, KB01_PASSWORD, KB01_INFO, onScreen,
} from '../../lib/kb';

const SHORT_PASSWORD = 'kb01';

test.describe('01.1 Creating your Scoryboard account', () => {
  test('the sign-up form, personal information, and the verification code screen', async ({ page }) => {
    // Clear the address in whichever layer a previous run left it in. The seed
    // does this too; the spec repeats it because a run that died after the
    // Firebase user was made would otherwise stop at "This email is already in
    // use" - and that is the article's own error state, captured deliberately
    // further down.
    await deleteAccount(KB01.signup, KB01_PASSWORD);

    await blockPromos(page);
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
    await quiet01(page);

    await shot(page, '01.1', '01-sign-up-form');

    // --- the two failures first, while the form is still on screen ----------
    // Order matters: once the account is made this screen is gone, so both
    // error states are captured before the real sign-up. They belong to the
    // article's "If it does not work" section, not to a numbered step, which is
    // why they carry the last two numbers.
    const email = page.getByPlaceholder('Email');
    const password = page.getByPlaceholder('Password');
    const signUp = page.getByRole('button', { name: 'Sign up', exact: true });

    await email.fill(KB01.signup);
    await password.fill(SHORT_PASSWORD);
    await signUp.click();
    await expect(page.getByText('Password must be at least 6 characters')).toBeVisible();
    await shot(page, '01.1', '07-password-too-short');

    // The persona's address exists, so this is the genuine duplicate-address
    // error rather than a contrived one.
    await email.fill(KB01.fresh);
    await password.fill(KB01_PASSWORD as string);
    await signUp.click();
    await expect(page.getByText('This email is already in use. Please use a different one.')).toBeVisible();
    await shot(page, '01.1', '08-email-already-in-use');

    // --- the real sign-up ---------------------------------------------------
    // Reload first. The error line stays on screen until the page is reloaded -
    // retyping the address does not clear it - and shot 02 is the form as a
    // reader who has made no mistake sees it.
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
    await quiet01(page);
    await page.getByPlaceholder('Email').fill(KB01.signup);
    await page.getByPlaceholder('Password').fill(KB01_PASSWORD as string);
    const submit = page.getByRole('button', { name: 'Sign up', exact: true });
    await expect(page.getByText('This email is already in use. Please use a different one.')).toBeHidden();
    await shot(page, '01.1', '02-sign-up-filled', { annotate: submit });

    await submit.click();
    await page.waitForURL('**/personalInfo', { timeout: 60_000 });
    await expect(page.getByText('Personal information', { exact: true })).toBeVisible();
    await quiet01(page);

    // Clipped to the card, not captured full page. Step 1 is taller than the
    // 900px viewport, and a full-page capture stitches the app's sticky header
    // into the middle of the image, over the First name field. Caught by looking
    // at the first run's output.
    await unstickHeader(page);
    const step1 = await authCard(page, 'Personal information');
    await shot(page, '01.1', '03-personal-information', { clip: step1 });

    await fillPersonalInfo(page, KB01_INFO.wizard);
    // The first checkbox is the terms; the second is the marketing opt-in and is
    // left alone, because the article tells the reader it is optional.
    const terms = page.locator('[role="checkbox"]').first();
    await terms.click();
    await expect(terms).toHaveAttribute('data-state', 'checked');

    const cont = page.getByRole('button', { name: 'Continue', exact: true });
    await shot(page, '01.1', '04-personal-information-filled', { clip: step1, annotate: cont });

    await cont.click();
    await page.waitForURL('**/email-verification', { timeout: 60_000 });
    await expect(page.getByText('Email Verification', { exact: true })).toBeVisible();
    await quiet01(page);

    // The countdown ticks every second, so it is masked. Everything else on this
    // screen is fixed.
    await shot(page, '01.1', '05-email-verification', { mask: [resendCountdown(page)] });

    // Wait for the countdown to run out, which is what turns the digits into a
    // Resend link. A condition, not a duration - the link is the thing being
    // waited for - but it does take the full minute the app counts down.
    const resend = onScreen(page.getByText('Resend', { exact: true })).first();
    await expect(resend).toBeVisible({ timeout: 120_000 });
    await shot(page, '01.1', '06-verification-resend', { annotate: resend });

    // Left unverified. Nothing below this line, on purpose.
  });
});
