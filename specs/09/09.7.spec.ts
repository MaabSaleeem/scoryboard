// 09.7 - Inviting people, sharing a preview and the matches calendar.
//
// Three things, and the first of them is a correction to the map.
//
// **There is no per-match invite.** `/match/invite` is in the app's own route
// enum, renders the match-page shell with empty tabs, and nothing in the bundle
// navigates to it. What actually happens is automatic: everybody in either
// line-up is sent a `MatchInvitation` notification when the match is created.
// Asserted here on the plain-Player account, which holds two of them - one per
// seeded fixture - without anybody having sent anything. The **referee is not
// notified at all**.
//
// **The public link IS public - changed, verified 2026-09-08.** The Share window
// offers `/match/:id/preview` with a QR code and says it is "the link you should
// share on social media, on your website or elsewhere". That is now true. A
// signed-out visitor gets the whole read-only match: both teams, the score, the
// countdown, the referee, the leaderboard, the date, the venue, the pitch, the
// organiser's note, both line-ups BY NAME and the FACTS panels. `GET /matches/:id`
// answers 200 with no token, and the names come from `GET /teams/:id/players`,
// which is public too. Shot 02 is that page.
//
// It used to be the opposite: a Sign In button, five empty tab labels and grey
// skeletons that never resolved. That is what shot 02 held until 2026-09-08.
//
// Two things did NOT change, and this spec must not be "harmonised" with them:
// `/matches/:id` (the signed-in route) still redirects a stranger to `/signin`,
// and a leaderboard's share link is still sign-in only - see 08.5.
//
// **The calendar** is `/schedule`, with three views. Month is the default and the
// only one with a text label.

import { test, expect } from '@playwright/test';
import {
  shot, signInAs, onScreen, asUser, mintSession,
  fixtures09, quiet09, freezeClock09, settled09, warm09, detailStrip09,
  openAddToCalendar, openShareMatch, namedDialog09, closeDialog09, calendarReady09, calendarView,
  fixtureCard09, sidebarIdentity09, moving09, parkPointer,
  openNotifications09, notificationTimes09,
  KB09, KB09_TEAMS, KB09_VENUES,
} from '../../lib/kb';

test.describe('09.7 Inviting people, sharing a preview and the matches calendar', () => {
  test('the share window, and what the link shows a signed-out visitor', async ({ page, browser }) => {
    const fx = await fixtures09();

    await signInAs(page, KB09.pro, `/matches/${fx.match.fixture}`);
    await freezeClock09(page);
    await page.reload();
    await quiet09(page);
    await detailStrip09(page, KB09_VENUES.astro.name);

    // 01 - Share a match: the link and the QR code.
    //
    // Neither is masked. docs/style-guide.md masks share codes and QR codes as a
    // rule and then says "Do not mask the thing the article is about. If a share
    // code is the subject, seed a fixed one and show it." This one is the subject,
    // and it is a seeded fixture's id, not a real person's.
    const dlg = await openShareMatch(page);
    const link = dlg.locator('input');
    const previewUrl = await link.inputValue();
    // The share link gained a slug segment: it is now
    // `/match/<home>-vs-<away>/<id>/preview`, not `/match/<id>/preview`.
    // Observed 2026-09-08. Assert the id and the route, not the exact shape, so
    // the slug can change again without failing this run.
    expect(previewUrl, 'the share link should be a match preview route carrying the id')
      .toMatch(new RegExp(`/match/.*${fx.match.fixture}/preview`));
    await settled09(page);
    await shot(page, '09.7', '01-share-window', { clip: dlg, clipPad: 24, annotate: link });
    await closeDialog09(page);

    // 02 - the same link, opened by somebody who is not signed in. A fresh context,
    // because this one holds a session: playwright.config.ts starts every context
    // signed out, so a new one is genuinely a stranger.
    const visitor = await browser.newContext();
    const guest = await visitor.newPage();
    try {
      // Freeze the visitor's clock too. The preview renders a live "Match starts
      // in" countdown, which ticks once a second and would otherwise put a
      // different number in every run of this capture.
      await freezeClock09(guest);
      await guest.goto(previewUrl, { waitUntil: 'domcontentloaded' });

      // The match itself, on a page nobody signed in to. Each of these is a claim
      // the article now makes, so each is asserted rather than eyeballed.
      await expect(guest.getByText(KB09_TEAMS.united).first()).toBeVisible({ timeout: 30_000 });
      await expect(guest.getByText(KB09_TEAMS.rovers).first()).toBeVisible();
      await expect(guest.getByText(KB09_VENUES.astro.name).first()).toBeVisible();
      await expect(guest.getByText('Match Preview (View Only)').first()).toBeVisible();
      // The organiser's note, which the article warns is readable by strangers.
      await expect(guest.getByText(/Meet at the clubhouse/).first()).toBeVisible();

      // The line-ups, by name. This is the sharpest of the article's claims -
      // that the link exposes your players' names - so prove it on the LINEUP
      // tab rather than trusting the payload.
      // onScreen, not .first(): the tab strip is rendered twice, once for the
      // wide layout and once for the narrow one, and the unused twin has a
      // zero-sized box. .first() picks the invisible one and the click times out.
      await onScreen(guest.getByText('LINEUP', { exact: true })).first().click();
      await expect(guest.getByText('Nia KB').first()).toBeVisible({ timeout: 30_000 });
      await expect(guest.getByText('Bo KB').first()).toBeVisible();
      await onScreen(guest.getByText('MATCH DETAILS', { exact: true })).first().click();
      await expect(guest.getByText(KB09_VENUES.astro.name).first()).toBeVisible();

      // Back to the top before the capture. Clicking through to LINEUP and back
      // leaves the page scrolled, and the first version of this shot cut off both
      // the "Match Preview (View Only)" heading and the tab strip - the two things
      // that tell a reader they are looking at the shared page and not the app.
      await guest.evaluate(() => window.scrollTo(0, 0));
      await expect(guest.getByText('Match Preview (View Only)').first()).toBeInViewport();

      await quiet09(guest);
      await settled09(guest);
      await shot(guest, '09.7', '02-preview-signed-out', {});
    } finally {
      await visitor.close();
    }
  });

  test('add to calendar, from the match and from a team fixture card', async ({ page }) => {
    const fx = await fixtures09();

    await signInAs(page, KB09.pro, `/matches/${fx.match.fixture}`);
    await freezeClock09(page);
    await page.reload();
    await quiet09(page);
    await detailStrip09(page, KB09_VENUES.astro.name);

    const mask = [sidebarIdentity09(page, 'Mo KB'), ...moving09(page)];

    // 03 - the Add to Calendar menu. Four ways out, and the control only exists
    // once the match is Scheduled - an Incomplete one has the gear alone.
    const menu = await openAddToCalendar(page);
    for (const app of ['Google', 'Outlook', 'Apple', 'Other']) {
      await expect(menu.getByText(app, { exact: true })).toBeVisible();
    }
    await parkPointer(page);
    await shot(page, '09.7', '03-add-to-calendar', { annotate: menu, mask });
    await page.keyboard.press('Escape');

    // 04 - the same control on a team's fixture card, which is where somebody who
    // is not running the match will find it.
    await page.goto(`/teams/${fx.teams.united}`);
    await quiet09(page);
    await expect(page.getByText('UPCOMING MATCHES')).toBeVisible({ timeout: 30_000 });
    const card = await fixtureCard09(page, KB09_VENUES.astro.name);
    const cardButton = card.getByText('Add to Calendar', { exact: true });
    await expect(cardButton).toBeVisible();
    await settled09(page);
    await parkPointer(page);
    await shot(page, '09.7', '04-card-add-to-calendar', {
      clip: card, annotate: cardButton, mask,
    });
  });

  test('the matches calendar, Month and Day', async ({ page }) => {
    const fx = await fixtures09();

    await signInAs(page, KB09.pro, '/schedule');
    await freezeClock09(page);
    await page.reload();
    await quiet09(page);
    await calendarReady09(page, 2);

    const mask = [sidebarIdentity09(page, 'Mo KB'), ...moving09(page)];

    // 05 - Month, the default. Both fixtures on their own days, each with its
    // kick-off and finish time. The clock is frozen so this opens on September;
    // without that it opens on whatever month it happens to be.
    await expect(page.getByText('September 01, 2026', { exact: true })).toBeVisible();
    await expect(calendarView(page, 'month')).toHaveAttribute('data-state', 'on');
    const entry = page.getByText(`${KB09_TEAMS.united} vs ${KB09_TEAMS.rovers}`).first();
    await parkPointer(page);
    await shot(page, '09.7', '05-calendar-month', {
      fullPage: true, annotate: entry, mask,
    });

    // 06 - Day. The first of the three view buttons; only the third is labelled,
    // so they are told apart by their icons (see calendarView in lib/kb.ts).
    //
    // Then 24 September, from the month picker beside it. Switching the view alone
    // lands on today - 1 September with the clock frozen - and both fixtures are
    // later in the month, so the first version of this capture was an empty column
    // reading "No matches" twice. True, and no use to a reader.
    await calendarView(page, 'day').click();
    await expect(calendarView(page, 'day')).toHaveAttribute('data-state', 'on');
    await expect(page.getByText('Day', { exact: true }).first()).toBeVisible({ timeout: 30_000 });
    await onScreen(page.getByText('24', { exact: true })).last().click();
    await expect(page.getByText('September 24, 2026', { exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(`${KB09_TEAMS.united} vs ${KB09_TEAMS.rovers}`).first())
      .toBeVisible({ timeout: 30_000 });
    await settled09(page);
    await parkPointer(page);
    await shot(page, '09.7', '06-calendar-day', { mask });
  });

  test('the match invitation a squad member is sent', async ({ page }) => {
    const fx = await fixtures09();
    const keep = new Set([fx.match.fixture, fx.match.second].map(String));

    // Asserted over the API first, because the point of the shot is that nobody
    // sent these: they arrived when the matches were created.
    const pip = await mintSession(KB09.player);
    const read = async () => {
      const listed = (await asUser(pip.idToken, '/notifications?limit=100&skip=0')).body?.data;
      const rows = listed?.result ?? listed ?? [];
      return Array.isArray(rows) ? rows : [];
    };
    let rows = await read();
    expect(rows.filter((n: any) => n.type === 'MatchInvitation' && keep.has(String(n.data?.matchId))).length,
      'each seeded fixture should have sent Pip a MatchInvitation').toBe(2);

    const rae = await mintSession(KB09.referee);
    const raeListed = (await asUser(rae.idToken, '/notifications?limit=100&skip=0')).body?.data;
    const raeRows = raeListed?.result ?? raeListed ?? [];
    expect((Array.isArray(raeRows) ? raeRows : []).filter((n: any) => n.type === 'MatchInvitation').length,
      'the referee is not notified - worth a line in the article').toBe(0);

    // Clear everything that is not one of the two fixtures' invitations.
    //
    // Not tidiness, and not optional. Every throwaway match the other six specs
    // create sends Pip an invitation of its own, so after a full run the panel
    // holds a dozen rows for matches that no longer exist, in whatever order this
    // run happened to make them. A capture of that is a capture of the suite's own
    // exhaust. Deleting them leaves exactly the two rows the article is about, and
    // the panel's own count becomes deterministic too.
    for (const n of rows) {
      if (n.type === 'MatchInvitation' && keep.has(String(n.data?.matchId))) continue;
      const r = await asUser(pip.idToken, `/notifications/${n.id}`, { method: 'DELETE' });
      expect(r.ok, `DELETE /notifications/${n.id}: ${JSON.stringify(r.body)}`).toBeTruthy();
    }
    rows = await read();
    expect(rows.length, 'only the two fixture invitations should be left').toBe(2);

    // 07 - the notifications panel. Its rows read "Match scheduled", which is what
    // the article has to quote: "Match invitation" is the wording the home page's
    // Trending strip uses for the same notification.
    await signInAs(page, KB09.player, '/');
    await freezeClock09(page);
    await quiet09(page);
    const panel = await openNotifications09(page);
    await expect(panel.getByText('Notifications (2)', { exact: true })).toBeVisible();
    await expect(panel.getByText(/Match scheduled/)).toHaveCount(2);
    await settled09(page);
    await parkPointer(page);
    await shot(page, '09.7', '07-match-invitation', {
      clip: panel,
      clipPad: 24,
      mask: [notificationTimes09(page)],
    });
  });
});
