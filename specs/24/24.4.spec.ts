// 24.4 - Language filtering, terms, privacy and what we store
//
// Three captures. Read `briefs/24.md`, "24.4", with this.
//
// --- The word filter is on the server -------------------------------------
//
// `POST /comments` answers the comment with the offending word replaced by
// asterisks, one per letter, and stores it that way. The same happens to team
// names and bios, player bios, friend names and chat messages
// (config/api.md, "Language filtering"). Nothing in the browser does it - the
// bundle carries no word list - so the reader types the word, presses Comment,
// and sees the asterisks come back.
//
// --- Preconditions --------------------------------------------------------
//
// `node scripts/seed-24.mjs` must have run. It REMAKES Marc's KB 24 Comments FC
// on every run, because a comment cannot be deleted - `DELETE /comments/:id`
// answers 401 to its own author - and this spec posts one. The spec asserts
// the panel is empty before it posts, which is how a run without a fresh seed
// fails rather than photographing two comments.
//
// The typed sentence is in lib/fixtures-24.mjs. Only the asterisked form
// appears in a screenshot.

import { test, expect } from '@playwright/test';
import {
  KB24, KB24_FILTERED, fixtures24, context24, open24, commentsContainer,
  openTeamComments24, onScreen, shot, type Fx24,
} from '../../lib/kb';

const ARTICLE = '24.4';

let fx: Fx24;

test.beforeAll(async () => { fx = await fixtures24(); });

test('01 - a comment with a swear word in it comes back with asterisks', async ({ browser }) => {
  const { ctx, page } = await context24(browser, KB24.reader);
  await openTeamComments24(page, fx.commentsTeam);
  const panel = commentsContainer(page);
  await expect(panel.getByText('No comments yet.', { exact: false })).toBeVisible();

  await page.getByPlaceholder('Write your comment...').fill(KB24_FILTERED.typed);
  const posted = page.waitForResponse((r) => r.url().includes('/comments') && r.request().method() === 'POST');
  await panel.getByRole('button', { name: 'Comment', exact: true }).click();
  const res = await posted;
  expect(res.status()).toBe(200);
  // The mask is in the API's own answer, not something the page did afterwards.
  const body = await res.json();
  expect(body?.data?.comment).toBe(KB24_FILTERED.shown);

  const comment = panel.getByText(KB24_FILTERED.shown, { exact: true });
  await expect(comment).toBeVisible();
  await expect(panel.getByText('Comments (1)', { exact: true })).toBeVisible();
  // The time stamp is the moment the spec ran. Masked: it is not the subject.
  const stamp = onScreen(panel.getByText(/\d{1,2}:\d{2} (AM|PM)/)).first();
  await shot(page, ARTICLE, '01-comment-language-filtered', {
    clip: panel,
    clipPad: 8,
    annotate: comment,
    mask: [stamp],
  });
  await ctx.close();
});

test('02 - Privacy Policy and Terms of Service, at the foot of every page', async ({ browser }) => {
  const { ctx, page } = await context24(browser, KB24.reader);
  const footer = page.locator('footer').first();
  await open24(page, '/profile-settings', footer.getByRole('link', { name: 'Terms of Service', exact: true }));
  const privacy = footer.getByRole('link', { name: 'Privacy Policy', exact: true });
  const terms = footer.getByRole('link', { name: 'Terms of Service', exact: true });
  await expect(privacy).toHaveAttribute('href', 'https://scoryboard.com/privacy-policy/');
  await expect(terms).toHaveAttribute('href', 'https://scoryboard.com/terms/');
  // Both links sit in one nav, which is the one annotation the step needs.
  const nav = terms.locator('xpath=ancestor::nav[1]');
  await expect(nav).toBeVisible();
  await shot(page, ARTICLE, '02-footer-privacy-terms', {
    clip: footer,
    clipPad: 8,
    annotate: nav,
  });
  await ctx.close();
});

test('03 - the personal details Scoryboard holds', async ({ browser }) => {
  const { ctx, page } = await context24(browser, KB24.reader);
  const heading = page.getByRole('heading', { name: 'Personal Details', exact: true });
  await open24(page, '/profile-settings', heading);
  // The row: the "Personal Details" column on the left, the fields on the right.
  const row = heading.locator('xpath=ancestor::div[contains(@class,"lg:flex-row")][1]');
  await expect(row.getByText('First Name', { exact: false }).first()).toBeVisible();
  await expect(row.getByText('Date of birth', { exact: false }).first()).toBeVisible();
  await expect(row.getByText('Email', { exact: false }).first()).toBeVisible();
  // The address is an input's value, not text on the page.
  const values = await row.locator('input').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));
  expect(values).toContain(KB24.reader);
  await shot(page, ARTICLE, '03-profile-personal-details', {
    clip: row,
    clipPad: 8,
  });
  await ctx.close();
});
