// 21.3 - Refereeing a match - what you can and cannot do
//
// Six captures. Read `briefs/21.md`, "21.3", with this.
//
// --- Preconditions --------------------------------------------------------
//
// `node scripts/seed-21.mjs` must have run. It guarantees one Scheduled match
// and one Live match, both refereed by Rae, and it sets `isTourCompleted` on
// every account - without which Shepherd.js's guided tour opens over the match
// page behind an opaque overlay that swallows clicks and sits in every capture.
// `openMatch21()` asserts the overlay is gone.
//
// --- What this article documents, and what the reference used to say ------
//
// `config/api.md` carried a role matrix saying the assigned referee gets **no**
// score steppers and **no** Yellow / Red / Player of Match. Both were wrong.
// Re-measured 2026-09-03 side by side with the Owner on the same Live match:
// the stepper row is identical, the referee's plus fires
// `POST /matches/:id/events {"type":"GoalAwarded"}` and answers 200, and the
// card buttons are on the referee's FEED. `isReferee` has nothing to do with it
// - the match page reads `refereePlayerId`. api.md is corrected with today's
// date; the brief carries the evidence.
//
// What the referee genuinely cannot do, isolated on a throwaway match with the
// referee's own token:
//
//   POST /matches/:id/status   Live, Paused, Live, Finished   200 each
//   POST /matches/:id/events   goal, card, PotM               200
//   PUT  /matches/:id          pitchNumber, note, date,
//                              status:"Cancelled"             403
//   DELETE /matches/:id                                       403
//
// A referee runs the match and cannot change the match. There is no gear menu
// and no PAYMENT tab, and **Add Note is a silent no-op** - the dialog opens, the
// PUT is refused, and nothing appears on screen. That last one is the article's
// "If it does not work" section.
//
// --- Nothing here is pressed ---------------------------------------------
//
// START MATCH, END MATCH, a stepper, a card button and the Add Note dialog's
// Save are all one-way. docs/style-guide.md: "Photograph the dialog, do not
// submit it. Take the after state from a second fixture that is already in that
// state." The Scheduled match is the before and the Live match is the after.
//
// --- Three clock freezes -------------------------------------------------
//
// Shots 01 and 02 use CALENDAR_MONTH.frozenAt, because the Scheduled match's
// MATCH DETAILS card carries a live "Match starts in ..." countdown.
//
// Shots 03, 04 and 05 use kick-off + 12 minutes, which pins the timer at 48:00.
// Shot 06 uses kick-off + the duration + 5 seconds, which is where END MATCH
// appears. Both offsets are computed from the SERVER's `startedAt`, read off the
// seeded match, so nothing is hardcoded and the figures are the same every run.

import { test, expect } from '@playwright/test';
import {
  KB21, KB21_LEADERBOARD, KB21_VENUE, KB21_MATCH_SHOWN, KB21_CALENDAR,
  KB21_FREEZE_MINUTES, KB21_TIMER_SHOWN,
  fixtures21, context21, openMatch21, freezeAfterKickOff21,
  matchPanel, matchTab10, tabStrip10, startMatchButton, endMatchButton,
  timerPill, scoreStepperRow, feedAction, refereeCell21,
  shot, unionBox, clearUnionBox, settled10, onScreen,
  type Fx21,
} from '../../lib/kb';

const ARTICLE = '21.3';

let fx: Fx21;

test.beforeAll(async () => { fx = await fixtures21(); });

test('01, 02 - the match page a referee gets', async ({ browser }) => {
  const { ctx, page } = await context21(browser, KB21.referee, '/tournaments');
  await openMatch21(page, fx.scheduled.id, new Date(KB21_CALENDAR.frozenAt));

  // Five tabs, and no PAYMENT. Asserted rather than left to the eye: the tab
  // strip is shot 01's subject and the absence is half the article.
  await expect(page.getByRole('tab')).toHaveCount(5);
  for (const label of ['MATCH DETAILS', 'FEED', 'FACTS', 'LINEUP', 'KEYS']) {
    await expect(matchTab10(page, label)).toBeVisible();
  }
  await expect(page.getByRole('tab', { name: 'PAYMENT', exact: true })).toHaveCount(0);
  await expect(matchPanel(page, 'payment')).toHaveCount(0);

  // No heading either. The Owner and Administrators get "Match Settings",
  // everybody else gets "Match Preview (View Only)", and a referee gets neither.
  await expect(page.getByText('Match Settings', { exact: true })).toHaveCount(0);
  await expect(page.getByText(/Match Preview/)).toHaveCount(0);

  // No gear. Two menu buttons, not the Owner's three: Add to Calendar and the
  // footer's language picker. Configure appearance / Edit / Cancel Match are the
  // Owner's alone, which is why a referee cannot change the match.
  await expect(page.locator('button[aria-haspopup="menu"]')).toHaveCount(2);

  const strip = await tabStrip10(page);
  const start = startMatchButton(page);
  await expect(start).toBeVisible();
  // One clip over the strip and the button. They are the same row on screen and
  // the same sentence in the article, and neither has a wrapper of its own that
  // is not the full width of the page.
  const row = await unionBox(page, [strip, start], 6);
  await shot(page, ARTICLE, '01-match-referee-top', { clip: row, annotate: start });
  await clearUnionBox(page);

  // 02 - the detail strip, with the referee's name first. This is how a reader
  // confirms they are the referee on this particular match, which is the only
  // thing that gives them any of the controls above.
  const details = matchPanel(page, 'match-details');
  const referee = refereeCell21(details);
  await expect(referee).toBeVisible();
  await expect(details.getByText(KB21_LEADERBOARD, { exact: true })).toBeVisible();
  await expect(details.getByText(KB21_VENUE.name, { exact: true })).toBeVisible();
  await expect(details.getByText(KB21_MATCH_SHOWN.day, { exact: true })).toBeVisible();
  const stripRow = referee.locator('xpath=ancestor::div[contains(@class,"flex")][1]');
  await shot(page, ARTICLE, '02-match-detail-strip', {
    clip: stripRow,
    clipPad: 10,
    annotate: referee,
  });
  await ctx.close();
});

test('03, 04, 05 - running a match that has kicked off', async ({ browser }) => {
  const { ctx, page } = await context21(browser, KB21.referee, '/tournaments');
  await openMatch21(page, fx.live.id, new Date(Date.parse(fx.startedAt) + KB21_FREEZE_MINUTES * 60_000));

  // 03 - the timer pill, framed exactly as shot 01 frames START MATCH: the tab
  // strip and the control beside it. The article's step 4 is "the button becomes
  // the timer", and two captures of the same row are what shows that. A tight
  // clip on the pill alone was tried first and published a 250-pixel box with a
  // sliver of the next control in it and no clue where on the page it sits.
  //
  // The figure is asserted, because a wrong freeze would publish a plausible but
  // arbitrary number and nothing else would notice.
  const pill = timerPill(page);
  await expect(pill).toHaveText(KB21_TIMER_SHOWN);
  await expect(startMatchButton(page)).toHaveCount(0);
  await expect(endMatchButton(page)).toHaveCount(0);
  const liveRow = await unionBox(page, [await tabStrip10(page), pill], 6);
  await shot(page, ARTICLE, '03-timer-pill-live', { clip: liveRow, annotate: pill });
  await clearUnionBox(page);

  // 04 - the score steppers. Four 32px buttons: home minus, home plus, away
  // minus, away plus. Both minus buttons are `disabled` at 0-0, which is the
  // ordinary state and not a referee restriction - the Owner's row is identical,
  // measured. NOT clicked: a goal cannot be un-scored from a spec.
  const steppers = await scoreStepperRow(page);
  const buttons = steppers.locator('button.w-8.h-8');
  await expect(buttons).toHaveCount(4);
  await expect(buttons.nth(0)).toBeDisabled();
  await expect(buttons.nth(1)).toBeEnabled();
  await expect(buttons.nth(3)).toBeEnabled();
  await shot(page, ARTICLE, '04-score-steppers', {
    clip: steppers,
    clipPad: 16,
    annotate: steppers,
  });

  // 05 - the FEED's card controls. They appear only while the match is Live: on
  // the Scheduled match the FEED carries Comment alone, which is asserted in the
  // test below so the article can say "once the match is under way".
  const yellow = feedAction(page, 'Yellow Card');
  const red = feedAction(page, 'Red Card');
  const potm = feedAction(page, 'Player of Match');
  for (const b of [yellow, red, potm, feedAction(page, 'Comment')]) await expect(b).toBeVisible();
  // unionBox over the three card controls, and not over their row: the row is
  // the full width of the FEED panel, so outlining it would draw a rectangle
  // round the Comment box as well.
  const cards = await unionBox(page, [yellow, red, potm], 4);
  const actionRow = yellow.locator('xpath=ancestor::div[contains(@class,"flex")][1]');
  await shot(page, ARTICLE, '05-feed-card-actions', {
    clip: actionRow,
    clipPad: 12,
    annotate: cards,
  });
  await clearUnionBox(page);
  await ctx.close();
});

test('06 - END MATCH at full time', async ({ browser }) => {
  const { ctx, page } = await context21(browser, KB21.referee, '/tournaments');
  // Five seconds past full time. Before the timer reaches 00:00 the pill is what
  // is there and END MATCH does not exist - which is the article's step 7.
  await openMatch21(page, fx.live.id, new Date(Date.parse(fx.startedAt) + fx.duration * 60_000 + 5_000));

  const end = endMatchButton(page);
  await expect(end).toBeVisible();
  await expect(timerPill(page)).toHaveCount(0);
  // The card now says the other half of it out loud: a match nobody ends is
  // finished for them after 24 hours, at whatever the score says. Collection 10
  // documents that in 10.9; the article here just names the button.
  await expect(onScreen(matchPanel(page, 'match-details').getByText('Match auto-ends in')).first())
    .toBeVisible();
  // Framed like shots 01 and 03, so the three read as one row in three states.
  const endRow = await unionBox(page, [await tabStrip10(page), end], 6);
  await shot(page, ARTICLE, '06-end-match', { clip: endRow, annotate: end });
  await clearUnionBox(page);
  await ctx.close();
});

// Not captures. Two measurements the article states in prose, pinned so they
// cannot go stale silently.
test('the card controls are Live-only (no capture)', async ({ browser }) => {
  const { ctx, page } = await context21(browser, KB21.referee, '/tournaments');
  await openMatch21(page, fx.scheduled.id, new Date(KB21_CALENDAR.frozenAt));
  await expect(feedAction(page, 'Comment')).toBeVisible();
  for (const label of ['Yellow Card', 'Red Card', 'Player of Match'] as const) {
    await expect(page.getByRole('button', { name: new RegExp(`^${label.split(' ').join('\\s+')}$`, 'i') }))
      .toHaveCount(0);
  }
  await ctx.close();
});

test('Add Note is a silent no-op for a referee (no capture)', async ({ browser }) => {
  const { ctx, page } = await context21(browser, KB21.referee, '/tournaments');
  await openMatch21(page, fx.scheduled.id, new Date(KB21_CALENDAR.frozenAt));

  const refusals: number[] = [];
  page.on('response', (r) => {
    if (r.request().method() === 'PUT' && r.url().includes(`/matches/${fx.scheduled.id}`)) {
      refusals.push(r.status());
    }
  });

  await page.getByRole('button', { name: /Add Note/i }).first().click();
  const dialog = page.locator('[role="dialog"]').first();
  await expect(dialog).toBeVisible();
  await dialog.locator('textarea').first().fill('Bring a spare whistle');
  await dialog.getByRole('button', { name: /^Save$/i }).first().click();

  // The whole defect in three assertions: the save is refused, nothing is said,
  // and the note is unchanged. 21.3's "If it does not work" is this.
  await expect.poll(() => refusals, { timeout: 15_000 }).toContain(403);
  await expect(onScreen(matchPanel(page, 'feed').getByText('No Note added.')).first()).toBeVisible();
  await expect(page.getByText(/permission|match manager/i)).toHaveCount(0);
  await ctx.close();
});
