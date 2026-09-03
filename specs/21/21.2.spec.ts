// 21.2 - Seeing your assigned matches
//
// Six captures. Read `briefs/21.md`, "21.2", with this.
//
// **The article is retitled.** The map called it "Accepting an invitation and
// seeing your assigned matches". There is no invitation: being added as a
// referee sends no notification and no email, no notification type is
// referee-related, there is no accept endpoint, and `refereePlayers[]` has no
// pending state. The brief carries all four measurements.
//
// **CHANGED during step 2: six captures, not five.** Step 1 recorded the panel's
// See All button as doing nothing. It opens a modal listing every refereed
// match - see `openSeeAllRefereed21` in `lib/kb.ts` for how the first
// measurement went wrong. That modal is the app's own answer to this article's
// title, so it is now shot 02 and the brief says so.
//
// --- Preconditions --------------------------------------------------------
//
// `node scripts/seed-21.mjs` must have run. It guarantees exactly three matches
// refereed by Rae - one Scheduled, one Live, one Finished - and exactly one
// referee with none, which is the last capture.
//
// --- Two clocks -----------------------------------------------------------
//
// Shots 01, 02, 03, 05 and 06 run on the real clock: every date they show comes
// from a fixture, not from `Date.now()`.
//
// Shot 04 is the calendar, which opens on the current month, so it freezes at
// `CALENDAR_MONTH.frozenAt` - 1 December 2026 - and both seeded fixtures are in
// that month. docs/style-guide.md: freeze the clock where the screen shows a
// date, "a calendar's today marker will otherwise differ every run".
//
// --- What is masked, and why ---------------------------------------------
//
// The finished match's date, on shots 02 and 03. It cannot carry a fixed one:
// events are accepted only while a match is Live and a match with a fixed past
// date is Live for about a second, so the seed dates it 90 seconds back and
// polls. Those captures are about the score and about the match being in your
// Past list, so the date and time cells are masked - docs/style-guide.md allows
// exactly that for "absolute dates and times that are not the point of the shot".

import { test, expect } from '@playwright/test';
import {
  KB21, KB21_MATCH_SHOWN, KB21_PLAYED_SCORE, KB21_VENUE, KB21_LEADERBOARD,
  fixtures21, context21, openRefereeProfile21, refereedMatchesPanel,
  refereedMatchTab, openRefereedTab21, refereedPanelWithOneCard21,
  openSeeAllRefereed21, matchCardStamps21, refereeCell21, refereeStatTiles21,
  freezeCalendarMonth21, calendarReady21, tournamentCard21, refereeBadge21,
  createdOn, shot, settled10, onScreen, sidebarIdentity, KB21_NAMES,
  type Fx21,
} from '../../lib/kb';

const ARTICLE = '21.2';

let fx: Fx21;

test.beforeAll(async () => { fx = await fixtures21(); });

test('01, 02, 03 - your next fixture, all of them, and your last one', async ({ browser }) => {
  const { ctx, page } = await context21(browser, KB21.referee, '/teams');
  await openRefereeProfile21(page, fx.referee.playerId);
  await settled10(page);

  // 01 - the panel as it opens. The Upcoming tab is active by default, and the
  // card is the SCHEDULED fixture rather than the Live one because the panel
  // sorts by date and LIVE_DATE is deliberately after MATCH_DATE. Asserted, not
  // assumed: if the two ever swap, this capture would quietly become a
  // photograph of a match already in progress.
  await expect(refereedMatchTab(page, 'Upcoming Matches')).toHaveAttribute('data-state', 'active');
  const panel = await refereedPanelWithOneCard21(page);
  await expect(panel.getByText(KB21_MATCH_SHOWN.short, { exact: true })).toBeVisible();
  await expect(panel.getByText(KB21_MATCH_SHOWN.time, { exact: true })).toBeVisible();
  await expect(panel.getByText(KB21_VENUE.name, { exact: true })).toBeVisible();
  await expect(panel.getByText(KB21_LEADERBOARD, { exact: true })).toBeVisible();
  await shot(page, ARTICLE, '01-upcoming-match', {
    clip: panel,
    clipPad: 8,
    annotate: refereeCell21(panel),
  });

  // 02 - See All. The panel shows one fixture; this shows every one. Both
  // upcoming cards are asserted, because "all of them" is the whole point and a
  // modal that opened on one card would say the opposite of the article.
  const dialog = await openSeeAllRefereed21(page);
  await expect(dialog.getByRole('button', { name: /Add to Calendar/i })).toHaveCount(2);
  await expect(dialog.getByText(KB21_MATCH_SHOWN.short, { exact: true })).toBeVisible();
  await shot(page, ARTICLE, '02-see-all-matches', { clip: dialog, clipPad: 12 });
  await dialog.getByRole('button', { name: /^Close$/i }).first().click();
  await expect(dialog).toBeHidden();

  // 03 - the Past tab. openRefereedTab21 waits for the score, which only a
  // finished match has, rather than for the tab's own data-state: both
  // tabpanels are in the DOM at once.
  await openRefereedTab21(page, 'Past Matches');
  const past = await refereedPanelWithOneCard21(page);
  const score = onScreen(
    page.getByText(`${KB21_PLAYED_SCORE.home} - ${KB21_PLAYED_SCORE.away}`, { exact: true }),
  ).first();
  await expect(score).toBeVisible();
  await shot(page, ARTICLE, '03-past-match', {
    clip: past,
    clipPad: 8,
    annotate: score,
    mask: matchCardStamps21(past),
  });
  await ctx.close();
});

test('05 - the tournament that added you', async ({ browser }) => {
  const { ctx, page } = await context21(browser, KB21.referee, '/tournaments');
  await settled10(page);
  const card = await tournamentCard21(page);
  const badge = refereeBadge21(card);
  await expect(badge).toBeVisible();
  await shot(page, ARTICLE, '05-tournament-referee-badge', {
    clip: card,
    clipPad: 8,
    annotate: badge,
    // "Created on 03/09/2026" is the day the seed made the tournament. It is not
    // the card's subject and it moves whenever the tournament is rebuilt.
    mask: [createdOn(page)],
  });
  await ctx.close();
});

test('04 - every match you are on, in the calendar', async ({ browser }) => {
  const { ctx, page } = await context21(browser, KB21.referee, '/teams');
  await freezeCalendarMonth21(page);
  await page.goto('/schedule');
  await settled10(page);
  // calendarReady21 asserts BOTH fixtures are drawn. That count is the point of
  // the capture: the calendar puts your assignments next to everything else in
  // your month, which neither the panel nor See All does.
  await calendarReady21(page);
  // Mask the signed-in name only, not the whole sidebar. The first run masked
  // sidebar(page) and published a 350-pixel black slab down the left-hand side
  // of a full-page capture. docs/style-guide.md asks for "the signed-in user's
  // avatar and full name", and the avatar here is two initials on a colour.
  await shot(page, ARTICLE, '04-schedule-december', {
    mask: [sidebarIdentity(page, KB21_NAMES.referee)],
  });
  await ctx.close();
});

test('06 - a referee with nothing to referee yet', async ({ browser }) => {
  const { ctx, page } = await context21(browser, KB21.newref, '/teams');
  await openRefereeProfile21(page, fx.newref.playerId);
  await settled10(page);

  // Nils is a referee with no matches at all, which is what a reader who has
  // just been added sees.
  const panel = await refereedMatchesPanel(page);
  await expect(panel.getByText('No matches yet, stay tuned!')).toBeVisible();
  // See All is ABSENT when the panel is empty. Asserted so the difference
  // between this capture and shots 01 and 02 is on the record.
  await expect(panel.getByRole('button', { name: /^See All$/i })).toHaveCount(0);
  const tiles = await refereeStatTiles21(page);
  await expect(tiles.getByText('0').first()).toBeVisible();

  // No mask: the clip is the panel, and the sidebar is not in it.
  await shot(page, ARTICLE, '06-no-matches-yet', { clip: panel, clipPad: 8 });
  await ctx.close();
});
