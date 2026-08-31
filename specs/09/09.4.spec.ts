// 09.4 - Match tags, and attaching a match to a leaderboard.
//
// Two fields on one form, and the article's point is that they are not the same
// kind of thing at all. **Game type** is decoration: it tags the match, it shows
// as a badge, and leaving it alone is fine - a new match starts on Friendly.
// **Leaderboard** is compulsory: without one the match never leaves Incomplete,
// whatever else is filled in.
//
// Flagged `role`. Only the Owner and a team Administrator can change either.
// Somebody who is merely on the team gets a page headed **Match Preview (View
// Only)** with no gear, no form and no Save changes - shot 05.
//
// The Game type dropdown offers seven values and **all seven work**. That was
// worth proving rather than assuming: the API's `tag` enum has fourteen and the
// label-to-value map is not a plain lower-case ("Pre Season" stores `pre season`
// with a space while "Casual Booking" stores `casualBooking`), so sending a
// lower-cased label by hand is refused and an API-only probe reads like an app
// bug. This spec drives the dropdown and asserts what was stored.

import { test, expect } from '@playwright/test';
import {
  shot, signInAs, onScreen, asUser,
  fixtures09, quiet09, freezeClock09, settled09, warm09, matchCard09, detailStrip09,
  sidebarIdentity09, moving09, parkPointer,
  KB09, KB09_TEAMS, KB09_LEADERBOARD, KB09_VENUES, KB09_GAME_TYPES,
} from '../../lib/kb';

test.describe('09.4 Match tags, and attaching a match to a leaderboard', () => {
  test('the Game type badge and the compulsory leaderboard', async ({ page }) => {
    const fx = await fixtures09();
    const astro = await fx.venue('astro');
    // An Incomplete match with everything except a leaderboard, so shot 03 shows
    // the field being filled and the spec can prove the status flips on it alone.
    const made = await asUser(fx.token, '/matches', {
      method: 'POST',
      body: {
        homeTeam: { teamId: fx.teams.united, formation: '2-1-1', players: [] },
        awayTeam: { teamId: fx.teams.rovers, formation: '2-1-1', players: [] },
        date: '2026-09-14T18:00:00.000Z',
        duration: '60 min',
        teamSize: '5 VS 5',
        clubLocationId: astro,
      },
    });
    expect(made.ok, `POST /matches: ${JSON.stringify(made.body)}`).toBeTruthy();
    const id: string = made.body.data.id;
    expect((await fx.detail(id)).status,
      'six of the seven fields are set; the missing leaderboard should hold it at Incomplete')
      .toBe('Incomplete');

    try {
      await signInAs(page, KB09.pro, `/matches/${id}`);
      await freezeClock09(page);
      await page.reload();
      await quiet09(page);

      const mask = [sidebarIdentity09(page, 'Mo KB'), ...moving09(page)];
      const form = page.locator('form')
        .filter({ has: page.getByRole('button', { name: 'Save changes' }) }).first();
      await expect(form).toBeVisible({ timeout: 30_000 });

      // 01 - the Game type list, all seven of them.
      const tagTrigger = onScreen(form.getByRole('combobox')).last();
      await tagTrigger.scrollIntoViewIfNeeded();
      await tagTrigger.click();
      for (const t of KB09_GAME_TYPES) {
        await expect(onScreen(page.getByText(t.label, { exact: true })).last()).toBeVisible();
      }
      const league = onScreen(page.getByText('League', { exact: true })).last();
      await shot(page, '09.4', '01-game-type-open', { annotate: league, mask });
      await league.click();
      await expect(form.locator('select[name="tag"]')).toHaveValue('League');

      // 03 - the Leaderboard list. Compulsory, though nothing on the form says so.
      //
      // Captured out of numerical order on purpose. Shot 02 is the badge above the
      // teams, and **the badge does not change until the match is saved** - the
      // first run of this spec took it straight after picking League and got a
      // picture of a match tagged Friendly with League in the dropdown, which is
      // the opposite of what the article says. So both remaining fields go in, the
      // match is saved, and then 02 and 04 are taken from the saved page.
      const boardTrigger = onScreen(form.getByRole('combobox')).first();
      await boardTrigger.scrollIntoViewIfNeeded();
      await boardTrigger.click();
      const boardOption = onScreen(page.getByText(KB09_LEADERBOARD, { exact: true })).last();
      await expect(boardOption).toBeVisible();
      await shot(page, '09.4', '03-leaderboard-open', { annotate: boardOption, mask });
      await boardOption.click();
      await expect(form.locator('select[name="leaderboard"]')).toHaveValue(fx.leaderboard.id);

      await page.getByRole('button', { name: 'Save changes' }).click();
      await expect(
        onScreen(page.getByText('This match will start automatically at the scheduled time and date.')).first(),
      ).toBeVisible({ timeout: 30_000 });
      const saved = await fx.detail(id);
      expect(saved.status, 'the leaderboard was the only thing missing').toBe('Scheduled');
      expect(saved.tag, 'the dropdown label League should store the tag league').toBe('league');

      // Reloaded before both remaining captures: the strip resolves the
      // leaderboard's name out of the store, and it is blank on the render that
      // follows a Save.
      await page.reload();
      await quiet09(page);
      await detailStrip09(page, KB09_VENUES.astro.name);
      const savedCard = await matchCard09(page);

      // 02 - the badge, now reading League. It sits between the two teams and it is
      // the only place the tag shows once the match is saved. Scoped to the card,
      // because "League" is also the leaderboard's name a few pixels below.
      const badge = onScreen(savedCard.getByText('League', { exact: true })).first();
      await expect(badge).toBeVisible();
      await parkPointer(page);
      await shot(page, '09.4', '02-tag-badge', { clip: savedCard, annotate: badge, mask });

      // 04 - the leaderboard in the match's own details, beside the venue and the
      // kick-off.
      const boardCell = page.getByText(KB09_LEADERBOARD, { exact: true }).first();
      await expect(boardCell).toBeVisible({ timeout: 30_000 });
      await parkPointer(page);
      await shot(page, '09.4', '04-strip-leaderboard', {
        clip: savedCard, annotate: boardCell, mask,
      });
    } finally {
      const status = await fx.cancel(id);
      expect(status, 'the throwaway match must be cancelled').toBe(200);
    }

  });

  // A test of its own, not a fifth act in the one above. Playwright gives each
  // test a fresh context (playwright.config.ts starts every one signed out), and
  // signing a second persona in on top of the first inside one test does not
  // reliably swap the app's view: the Firebase session lives in IndexedDB, the
  // token exchange replaces it, and the already-mounted React tree keeps the old
  // user. The first version of this spec signed Pip in after Mo and photographed
  // Mo's page.
  test('what somebody who only plays for the team sees', async ({ page }) => {
    const fx = await fixtures09();

    // 05 - the role half. Somebody who is on the team but does not run it gets a
    // different page: Match Preview (View Only), no gear, no form.
    //
    // warm09() first, and not for tidiness. Opening a match straight from the
    // address bar as a non-owner leaves the away team, the venue and the referee
    // rendering as "Add Away Team", "Location not set" and "Not set" - the store
    // slice the page reads those names from is only filled by /teams. Proved twice
    // each way on staging 2026-08-31.
    await signInAs(page, KB09.player, '/');
    await freezeClock09(page);
    await warm09(page);
    await page.goto(`/matches/${fx.match.fixture}`);
    await quiet09(page);
    // The page's own h1 reads "Match Preview (View Only)" - and it is
    // `display: none` at every desktop width, so a reader never sees those words.
    // Asserted both ways so a spec change cannot quietly start claiming otherwise:
    // the markup is there, the label is not on screen.
    const viewOnly = page.locator('main h1');
    await expect(viewOnly).toHaveText('Match Preview (View Only)');
    await expect(viewOnly).toBeHidden();
    // What the reader actually sees is an absence: no gear, so no Edit and no
    // Cancel Match; no Request Payment; no START MATCH; and no form to save.
    await expect(page.locator('#show-tour-button')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Save changes' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'START MATCH' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Request Payment' })).toHaveCount(0);
    // The away team is badged External: Pip is on United, not on Rovers.
    await expect(onScreen(page.getByText('External', { exact: true })).first()).toBeVisible();
    await detailStrip09(page, KB09_VENUES.astro.name);
    await settled09(page);
    await parkPointer(page);
    await shot(page, '09.4', '05-player-view-only', {
      mask: [sidebarIdentity09(page, 'Pip KB'), ...moving09(page)],
    });
  });
});
