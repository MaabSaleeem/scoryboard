// 24.2 - Photo and file upload limits
//
// Four captures. Read `briefs/24.md`, "24.2", with this.
//
// Three layers say three different things about the same upload, and the
// article's job is to tell the reader which one they are looking at:
//
//   1. the page's caption - "JPG, GIF or PNG. 3MB max." - is what you may CHOOSE;
//   2. the browser's own check on the comment composer and the match feed -
//      "File exceeds 3 MB" for an image, "File exceeds 200 MB" for a video -
//      refuses before any request is sent;
//   3. the server's check - `413 "File too large"` - is stricter than the page
//      for a comment attachment (2MB, not 3MB), and the composer prints the
//      server's words.
//
// --- Preconditions --------------------------------------------------------
//
// `node scripts/seed-24.mjs` must have run. Captures 02 and 03 use Marc's
// KB 24 Comments FC, which the seed remakes every run, so the composer is
// clean. Capture 04 is Owen's, because only a Pro account gets Add media on the
// match feed at all (10.8 documents the Free gate).
//
// The oversize files are generated on the first run into
// test-results/24-fixtures/ and never committed - see oversizeFiles24() in
// lib/kb.ts. Their names are printed on screen, so they are fixtures.

import { test, expect } from '@playwright/test';
import {
  KB24, KB24_LIMITS, fixtures24, context24, open24, cardHolding, commentComposer,
  openTeamComments24, openFeedAddComment24, oversizeFiles24, onScreen, shot, type Fx24,
} from '../../lib/kb';

const ARTICLE = '24.2';

let fx: Fx24;
let files: Awaited<ReturnType<typeof oversizeFiles24>>;

test.beforeAll(async () => {
  fx = await fixtures24();
  files = await oversizeFiles24();
});

test('01 - what the page promises', async ({ browser }) => {
  const { ctx, page } = await context24(browser, KB24.reader);
  const caption = onScreen(page.getByText(KB24_LIMITS.caption, { exact: true })).first();
  await open24(page, '/profile-settings', caption);
  const card = cardHolding(page, KB24_LIMITS.caption);
  // The card holds two file inputs - the banner's and the photo's - and both
  // filter to images. Asserted so the article's "the picker only offers images"
  // stays true.
  const inputs = card.locator('input[type="file"]');
  await expect(inputs).toHaveCount(2);
  for (const accept of await inputs.evaluateAll((els) => els.map((e) => (e as HTMLInputElement).accept))) {
    expect(accept).toBe('image/*');
  }
  await shot(page, ARTICLE, '01-profile-photo-format-caption', {
    clip: card,
    clipPad: 8,
    annotate: caption,
  });
  await ctx.close();
});

test('02 - refused in the browser: an image over 3 MB', async ({ browser }) => {
  const { ctx, page } = await context24(browser, KB24.reader);
  await openTeamComments24(page, fx.commentsTeam);
  const composer = commentComposer(page);
  const input = composer.locator('input[type="file"]');
  await expect(input).toHaveAttribute('accept', 'image/*');
  // No request may go out: the size check is in the browser. A request that
  // does go out means the check moved server-side and the article is wrong.
  let uploads = 0;
  page.on('request', (r) => { if (r.url().includes('/comments/media')) uploads += 1; });
  await input.setInputFiles(files.photo3mb);
  const message = composer.getByText(`File exceeds ${KB24_LIMITS.composerImageMb} MB: ${files.names.photo3mb}`, { exact: true });
  await expect(message).toBeVisible();
  expect(uploads).toBe(0);
  await shot(page, ARTICLE, '02-comment-file-exceeds-3mb', {
    clip: composer,
    clipPad: 8,
    annotate: message,
  });
  await ctx.close();
});

test('03 - refused by the server: an image the page accepted', async ({ browser }) => {
  const { ctx, page } = await context24(browser, KB24.reader);
  await openTeamComments24(page, fx.commentsTeam);
  const composer = commentComposer(page);
  // 2.48MB passes the composer's 3MB check and is posted. The server's limit
  // is 2MB and it answers 413 - pinned here, so the day the two agree this
  // spec fails and the article gets corrected.
  const refused = page.waitForResponse((r) => r.url().includes('/comments/media') && r.request().method() === 'POST');
  await composer.locator('input[type="file"]').setInputFiles(files.photo2mb);
  const res = await refused;
  expect(res.status()).toBe(413);
  const message = composer.getByText('File too large', { exact: true });
  await expect(message).toBeVisible();
  await shot(page, ARTICLE, '03-comment-file-too-large-server', {
    clip: composer,
    clipPad: 8,
    annotate: message,
  });
  await ctx.close();
});

test('04 - a video over 200 MB on the match feed', async ({ browser }) => {
  const { ctx, page } = await context24(browser, KB24.owner);
  const heading = onScreen(page.getByRole('heading', { name: 'Match Settings', exact: true })).first();
  await open24(page, `/matches/${fx.match}`, heading);
  await expect(page.locator('dialog.shepherd-element')).toHaveCount(0);
  const dlg = await openFeedAddComment24(page);
  const input = dlg.locator('input[type="file"]');
  await expect(input).toHaveAttribute('accept', 'image/*,video/*');
  let uploads = 0;
  page.on('request', (r) => { if (r.url().includes('/media')) uploads += 1; });
  await input.setInputFiles(files.video);
  const message = dlg.getByText(`File exceeds ${KB24_LIMITS.composerVideoMb} MB: ${files.names.video}`, { exact: true });
  await expect(message).toBeVisible();
  expect(uploads).toBe(0);
  await shot(page, ARTICLE, '04-match-feed-video-exceeds-200mb', {
    clip: dlg,
    clipPad: 12,
    annotate: message,
  });
  await ctx.close();
});
