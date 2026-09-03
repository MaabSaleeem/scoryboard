// 20.2 - The emails Scoryboard sends you.
//
// The article was mapped as "Every email Scoryboard sends you". **"Every" is a
// promise this collection cannot keep**, so the title is narrowed.
//
// Fifteen distinct subjects were collected out of the four accounts' inboxes
// after driving every flow collection 20 can reach, and they are the article's
// table. What is missing, and why:
//
//   - the payment emails. `PaymentRequested`, `PaymentReceived` and
//     `PaymentFailed` are in the API's notification enum, and all three need a
//     connected Stripe payout account - which briefs/17.md records as
//     un-rebuildable from here.
//   - the tournament-organiser emails. `TournamentUpdate` needs a tournament
//     phase ended with the "notify followers" option, which is collections 13
//     and 15.
//
// An article called "Every email" would have to list those or be wrong. It
// lists what was observed instead. briefs/20.md carries the gap.
//
// --- Why these captures are rendered rather than screenshotted ------------
//
// lib/mail.mjs has the long version. The short one: **yopmail strips every
// `src` attribute out of its HTML view** - `<img width="250" height="55"
// alt="ScoryBoard">` is what is left of the logo - and its own "Show pictures"
// control cannot put them back, because the attribute is gone. A capture taken
// in yopmail is an email with four broken images in it. Its **Source** view
// hands back the raw MIME with the attributes intact, so openEmailsFrom() takes
// the `text/html` part, decodes it, and renders it in a blank page at a
// mail-client width.
//
// That is the email's own HTML rendered by a browser, which is what a mail
// client does. What it drops is yopmail's chrome and yopmail's broken pictures.
// The whole of it is in the spec, so a re-run reproduces it.
//
// --- yopmail throttles ------------------------------------------------------
//
// It rate-limits by IP and answers with a CAPTCHA - lib/api.mjs records the
// same thing stopping collection 01 mid-session. **Nothing here tries to solve
// it**; refuseOnCaptcha() turns it into a sentence that says to wait and
// re-run. What keeps it away is doing fewer page loads, so this spec makes
// exactly four inbox visits, takes both of Pia's captures out of one of them,
// and reads the subject list out of the visits it was making anyway.

// --- THIS SPEC IS WRITTEN AND UNRUN. Read this before running it. ----------
//
// **20.2 was published table-only, with no images**, on the repo owner's
// instruction on 2026-09-03. yopmail rate-limited this IP mid-run and started
// answering a CAPTCHA in place of every message body. The four captures below
// had been produced twice before that, so they are reachable - they were just
// not in the published article, and the run could not wait for the throttle.
//
// So when this spec next runs and succeeds, **articles/src/20.2.html has no
// `{{shot:}}` placeholders left in it**, and scripts/build-article.mjs will
// refuse to build with "captured but never shown in the article". That is the
// guard working, not a bug. Put the four placeholders back first - briefs/20.md
// keeps their alt text and their masking under 20.2's screenshot table.
//
// Order of work for whoever picks this up:
//
//   1. node scripts/seed-20.mjs
//   2. npx playwright test specs/20/20.2.spec.ts
//   3. node scripts/finalise-shots.mjs 20 20.2
//   4. restore the four {{shot:}} placeholders in articles/src/20.2.html
//   5. commit and push the four images, then build and publish 20.2 again
//
// If step 2 fails naming a CAPTCHA, that is the throttle again: wait and
// re-run. Do not answer it.

import { test, expect } from '@playwright/test';
import {
  shot, fixtures20, openEmailsFrom, inbox,
  verificationCodePill20, emailKickOffLine20,
  KB20, KB20_EMAILS, KB20_TEAMS, KB20_LEADERBOARD, KB20_SENDER,
} from '../../lib/kb';

/** A mail-client column, not a browser viewport. See lib/mail.mjs. */
const MAIL_WIDTH = 760;

test.describe('20.2 The emails Scoryboard sends you', () => {
  test('four representative emails, and the whole table checked', async ({ browser }) => {
    await fixtures20();

    const ctx = await browser.newContext({
      viewport: { width: MAIL_WIDTH, height: 1400 },
      deviceScaleFactor: 2,
      timezoneId: 'Europe/London',
      locale: 'en-GB',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });

    const seen: string[] = [];
    try {
      // ---- Pia's inbox: shots 01 and 04, out of one visit ----------------
      const pia = await openEmailsFrom(ctx, KB20.player, [
        /^Match Invitation/,
        /replied to your comment/,
      ], { width: MAIL_WIDTH });
      seen.push(...pia.subjects);

      // --- 01: a match email -----------------------------------------------
      //
      // The fixture names are asserted, so a capture from somebody else's
      // inbox cannot pass for this one. The kick-off line is masked: it is the
      // only absolute date in the message, it is printed in UTC rather than in
      // the reader's own timezone, and 20.1 is the article that owns the
      // fixture's date.
      {
        const { page, subject } = pia.emails[0];
        expect(subject).toContain(KB20_TEAMS.home);
        expect(subject).toContain(KB20_TEAMS.away);
        await expect(page.getByText('Match Day Invite')).toBeVisible();
        await expect(page.getByRole('link', { name: 'View Match' })).toBeVisible();
        await shot(page, '20.2', '01-email-match-invitation', {
          mask: [emailKickOffLine20(page)],
        });
        await page.close();
      }

      // --- 04: a social email ----------------------------------------------
      {
        const { page, subject } = pia.emails[1];
        expect(subject).toContain(KB20_LEADERBOARD);
        await shot(page, '20.2', '04-email-comment-reply');
        await page.close();
      }

      // ---- Milo's inbox: shot 02 ------------------------------------------
      const milo = await openEmailsFrom(ctx, KB20.mate, [
        /^You're Invited$/,
      ], { width: MAIL_WIDTH });
      seen.push(...milo.subjects);

      // --- 02: the invitation email ----------------------------------------
      //
      // Nothing to mask. It carries a name, a team name and an Accept
      // Invitation button, all of them fixture values.
      {
        const { page } = milo.emails[0];
        await expect(page.getByText("You're Invited to Join a Team")).toBeVisible();
        await expect(page.getByRole('link', { name: 'Accept Invitation' })).toBeVisible();
        await expect(page.getByText(KB20_TEAMS.home, { exact: false })).toBeVisible();
        await shot(page, '20.2', '02-email-team-invitation');
        await page.close();
      }

      // ---- Emmy's inbox: shot 03 ------------------------------------------
      const emmy = await openEmailsFrom(ctx, KB20.empty, [
        /verification code/,
      ], { width: MAIL_WIDTH });
      seen.push(...emmy.subjects);

      // --- 03: an account email --------------------------------------------
      //
      // The six-digit code is masked. docs/style-guide.md: mask "IDs, share
      // codes, invite codes" - and this one is a live code that was really
      // sent. The pill it sits in is what gets painted, not the digits alone: a
      // black bar six characters wide inside a blue button reads as damage.
      {
        const { page } = emmy.emails[0];
        await expect(page.getByText('Verify your email address')).toBeVisible();
        await expect(verificationCodePill20(page)).toBeVisible();
        await shot(page, '20.2', '03-email-verification-code', {
          mask: [verificationCodePill20(page)],
        });
        await page.close();
      }

      // ---- Ollie's inbox, for the table only -----------------------------
      //
      // He is the only holder of two of the fifteen subjects - "New Player
      // Joined Your Team" and "Welcome to Scoryboard, set your password" - so
      // the table cannot be checked without one visit to his box.
      const reader = await ctx.newPage();
      try {
        seen.push(...(await inbox(reader, KB20.owner)).map((r) => r.subject));
      } finally {
        await reader.close();
      }

      // ---- the table ------------------------------------------------------
      //
      // Every row of the article's reference table, checked against a real
      // inbox. `subject` carries placeholders where the app puts a fixture
      // name or a score, so each row is matched on the fixed part of its own
      // subject line rather than on the whole string.
      //
      // This is the assertion that keeps 20.2 honest. The table is the article,
      // and a table nothing checks is a table that rots the first time a
      // subject line is reworded.
      const missing: string[] = [];
      for (const row of KB20_EMAILS) {
        const fixed = row.subject
          .replace(/<[A-Za-z]+>/g, ' ')
          .split(' ')
          .map((part) => part.replace(/\*/g, '').trim())
          .filter((part) => part.length > 3);
        const found = seen.some((s) => fixed.every((part) => s.includes(part)));
        if (!found) missing.push(`${row.key}: ${row.subject}`);
      }
      expect(missing, `subjects in the article's table that no inbox holds:\n  ${missing.join('\n  ')}`)
        .toEqual([]);

      // And the sender. The address is production's even on staging; the
      // display name is not, which is why the article names the address and
      // never the display name.
      expect(KB20_SENDER).toBe('noreply@scoryboard.com');
    } finally {
      await ctx.close();
    }
  });
});
