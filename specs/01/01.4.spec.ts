// 01.4 - The setup wizard, what each step does.
//
// The order, walked end to end and read off the wire:
//
//   /signup -> Step 1 Personal information -> the six-digit code
//           -> Create Leaderboard -> Step 3 Set up your team
//           -> Join a team, Setup my team, or Skip
//
// There is no screen labelled Step 2. The screens say Step 1, Step 3 and Step 4;
// the code screen carries no label at all; and Step 4, Select Club Location,
// renders but nothing in the app navigates to it. See briefs/01.md.
//
// --- Why this spec builds its account twice -------------------------------
//
// The wizard cannot be walked in one pass by anything except a person with an
// inbox. Step 1 and the code screen are only visible while the account is
// unverified - once POST /users has run, the guard sends anyone who opens
// /personalInfo to /email-verification, and once the address is verified it
// sends them on to /createLeaderboard. Nothing returns the six-digit code over
// the API.
//
// So: the first half is photographed on a real signup, and then the same address
// is rebuilt on the far side of verification and the second half is photographed
// on that. Every screen below is the screen a reader sees, in the order they see
// it. What the spec does not do is prove that typing the code is what moves you
// between them - that was verified by hand during step 1, before yopmail began
// demanding a CAPTCHA and closed the inbox route off.

import { test, expect } from '@playwright/test';
import {
  shot, quiet01, blockPromos, deleteAccount, rebuildVerified01, signInWithPassword,
  fillPersonalInfo, pickFromList, resendCountdown, authCard, unstickHeader,
  profileHeader, joinedSince, onScreen, KB01, KB01_PASSWORD, KB01_INFO,
} from '../../lib/kb';

const LEADERBOARD = 'KB 01 Wizard League';

test.describe('01.4 The setup wizard - what each step does', () => {
  test('Step 1, the code screen, Create Leaderboard, and the three ways out of Step 3', async ({ page }) => {
    await deleteAccount(KB01.wizard, KB01_PASSWORD);
    await blockPromos(page);

    // --- Step 1, on a real signup -------------------------------------------
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
    await page.getByPlaceholder('Email').fill(KB01.wizard);
    await page.getByPlaceholder('Password').fill(KB01_PASSWORD as string);
    await page.getByRole('button', { name: 'Sign up', exact: true }).click();

    await page.waitForURL('**/personalInfo', { timeout: 60_000 });
    await expect(page.getByText('Personal information', { exact: true })).toBeVisible();
    await quiet01(page);
    await unstickHeader(page);

    const step1 = await authCard(page, 'Personal information');
    await shot(page, '01.4', '01-step-1-personal-information', { clip: step1 });

    // Each list is captured as a viewport rather than clipped to the card: the
    // lists are portalled outside it, so a clip to the card shows the list
    // floating over a form nobody can see.
    await page.locator('input[name="name"]').fill(KB01_INFO.wizard.name);
    await page.locator('input[name="lastName"]').fill(KB01_INFO.wizard.lastName);

    await page.locator('label', { hasText: 'Gender *' }).locator('xpath=following-sibling::button[1]').click();
    await expect(page.getByRole('option', { name: 'Prefer not to say', exact: true })).toBeVisible();
    await shot(page, '01.4', '02-gender-list');
    await page.getByRole('option', { name: KB01_INFO.wizard.gender, exact: true }).click();

    // Sports decides which positions the next list offers, which is the one
    // thing on this screen that is not obvious.
    await page.locator('label', { hasText: 'Sports *' }).locator('xpath=following-sibling::button[1]').click();
    await expect(page.getByRole('option', { name: 'Padel', exact: true })).toBeVisible();
    await shot(page, '01.4', '03-sports-list');
    await page.getByRole('option', { name: 'Football', exact: true }).click();
    // The sports list is a multi-select and stays open after a choice.
    await page.keyboard.press('Escape');

    await page.locator('label', { hasText: 'Preferred position *' }).locator('xpath=following-sibling::button[1]').click();
    await expect(page.getByRole('option', { name: 'Goalkeeper', exact: true })).toBeVisible();
    await shot(page, '01.4', '04-position-list');
    await page.getByRole('option', { name: KB01_INFO.wizard.position, exact: true }).click();

    const terms = page.locator('[role="checkbox"]').first();
    await terms.click();
    await expect(terms).toHaveAttribute('data-state', 'checked');
    const cont = page.getByRole('button', { name: 'Continue', exact: true });
    await shot(page, '01.4', '05-step-1-filled', { clip: step1, annotate: cont });

    await cont.click();
    await page.waitForURL('**/email-verification', { timeout: 60_000 });
    await expect(page.getByText('Email Verification', { exact: true })).toBeVisible();
    await quiet01(page);
    await shot(page, '01.4', '06-email-verification', { mask: [resendCountdown(page)] });

    // --- and now the far side of verification --------------------------------
    await rebuildVerified01(KB01.wizard, KB01_INFO.wizard);
    await signInWithPassword(page, KB01.wizard, '/createLeaderboard');
    await expect(page.getByText('Create Leaderboard', { exact: true })).toBeVisible();
    await quiet01(page);
    await unstickHeader(page);

    const boardStep = await authCard(page, 'Create Leaderboard');
    await shot(page, '01.4', '07-create-leaderboard', { clip: boardStep });

    await page.locator('input[name="leaderboardName"]').fill(LEADERBOARD);
    const boardContinue = page.getByRole('button', { name: 'Continue', exact: true });
    await shot(page, '01.4', '08-create-leaderboard-filled', { clip: boardStep, annotate: boardContinue });

    await boardContinue.click();
    await page.waitForURL('**/setupYourTeam', { timeout: 60_000 });
    await expect(page.getByText('Set up your team', { exact: true })).toBeVisible();
    await quiet01(page);
    await unstickHeader(page);

    const step3 = await authCard(page, 'Set up your team');
    await shot(page, '01.4', '09-step-3-set-up-your-team', { clip: step3 });

    // Join: nobody has invited this account, which is what most readers see.
    await page.getByRole('button', { name: 'Join', exact: true }).click();
    await page.waitForURL('**/team/join', { timeout: 30_000 });
    await expect(page.getByText("You don't have any pending team invites.")).toBeVisible();
    await quiet01(page);
    await unstickHeader(page);
    const joinCard = await authCard(page, 'Join a team');
    await shot(page, '01.4', '10-join-a-team', { clip: joinCard });

    // Setup my team: not a team form at all - it opens match creation, and the
    // team is made on the way through. Worth a screenshot precisely because the
    // label does not say so.
    await page.goto('/setupYourTeam');
    await expect(page.getByText('Set up your team', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Setup', exact: true }).click();
    await page.waitForURL('**/match/create', { timeout: 30_000 });
    await expect(onScreen(page.getByText('Create your match', { exact: true })).first()).toBeVisible();
    await quiet01(page);
    await unstickHeader(page);
    await shot(page, '01.4', '11-setup-my-team');

    // Skip: straight into the app.
    await page.goto('/setupYourTeam');
    await expect(page.getByText('Set up your team', { exact: true })).toBeVisible();
    await page.getByText('Skip', { exact: true }).click();
    await page.waitForURL((u) => u.pathname === '/', { timeout: 30_000 });
    await expect(page.locator('a[href="/teams"]').first()).toBeVisible();
    await quiet01(page);
    const header = await profileHeader(page);
    await shot(page, '01.4', '12-home-after-skip', { clip: header, mask: [joinedSince(page)] });
  });
});
