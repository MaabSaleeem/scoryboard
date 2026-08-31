// 09.1 - Creating a match.
//
// The thing to understand about this screen: **Create Match creates the match.**
// The click fires `POST /matches {"status":"Incomplete"}` and lands you on
// `/matches/:id`, headed Match Settings, which is already a real match row. You
// then fill in the details and select Save changes. Nothing is asked first and
// nothing is confirmed.
//
// So this spec builds a real match and cancels it in a `finally`. It never
// touches the two seeded fixtures: a venue and a leaderboard cannot be taken off
// a match again, so any mutation of a shared fixture would be permanent.
//
// Cancelling is how a spec disposes of a match. `DELETE /matches/:id` answers
// "Match cancelled successfully" and sets status Cancelled; the row survives but
// vanishes from the calendar, from a team's match lists and from the
// leaderboard's - so the next run photographs the same two fixtures it did last
// time. See lib/fixtures-09.mjs.

import { test, expect } from '@playwright/test';
import {
  shot, signInAs, onScreen, asUser,
  fixtures09, quiet09, freezeClock09, calendarReady09, detailStrip09, matchCard09,
  sidebarIdentity09, moving09, parkPointer, dayCell, nextMonth,
  KB09, KB09_TEAMS, KB09_LEADERBOARD, KB09_VENUES,
} from '../../lib/kb';

test.describe('09.1 Creating a match', () => {
  test('create a match from the calendar and fill in its details', async ({ page }) => {
    const fx = await fixtures09();
    let created: string | null = null;

    await signInAs(page, KB09.pro, '/schedule');
    await freezeClock09(page);
    // The clock is pinned after sign-in, so reload to let the calendar pick it up:
    // it reads the month once, on mount.
    await page.reload();
    await quiet09(page);
    await calendarReady09(page, 2);

    const mask = [sidebarIdentity09(page, 'Mo KB'), ...moving09(page)];

    try {
      // 01 - the calendar, with the button that makes a match. Outlined and not
      // yet used, because the next click is the one that creates it.
      const createMatch = onScreen(page.getByRole('button', { name: 'Create Match' })).first();
      await parkPointer(page);
      await shot(page, '09.1', '01-schedule-create-match', { annotate: createMatch, mask });

      // The click that creates the match. Wait for the id in the URL rather than
      // for the page to settle - that is the only proof the POST landed.
      await createMatch.click();
      await page.waitForURL(/\/matches\/[a-f0-9]+$/, { timeout: 30_000 });
      created = page.url().split('/matches/')[1];
      await quiet09(page);

      // 02 - what you land on. A real match with nothing in it: the two Add Team
      // buttons and an empty MATCH DETAILS form.
      const addHome = onScreen(page.getByText('Add Home Team', { exact: true })).first();
      await expect(addHome).toBeVisible({ timeout: 30_000 });
      await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible();
      await parkPointer(page);
      await shot(page, '09.1', '02-fresh-match-settings', { annotate: addHome, mask });

      // 03 - the Add Team window. One search box, a Select team list, a Create
      // Team link and Add.
      await addHome.click();
      const dlg = page.getByRole('dialog');
      await expect(dlg.getByText('Add Team')).toBeVisible();
      const pick = onScreen(dlg.getByRole('combobox')).first();
      await expect(dlg.getByPlaceholder('Search team names')).toBeVisible();
      await shot(page, '09.1', '03-add-team-window', { clip: dlg, clipPad: 24, annotate: pick });

      // 04 - a team chosen. Its crest appears at the top of the window and Add is
      // what commits it.
      await pick.click();
      const option = onScreen(page.getByText(KB09_TEAMS.united, { exact: true })).last();
      await expect(option).toBeVisible();
      await option.click();
      const add = onScreen(dlg.getByRole('button', { name: 'Add', exact: true })).first();
      await expect(add).toBeEnabled();
      await shot(page, '09.1', '04-add-team-chosen', { clip: dlg, clipPad: 24, annotate: add });

      // Both teams, over the API's own PUT. Not a shortcut: the card does not
      // redraw after an Add - the PUT lands, the window closes, and the button
      // still says Add Away Team until the page is reloaded. Doing the away side
      // through the window as well would photograph the same window twice and
      // still need the reload, so the second one goes in by the same call the
      // window makes and shot 05 is taken after one reload.
      await add.click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      const put = await asUser(fx.token, `/matches/${created}`, {
        method: 'PUT',
        body: { awayTeam: { teamId: fx.teams.rovers, players: [] } },
      });
      expect(put.ok, `PUT awayTeam: ${JSON.stringify(put.body)}`).toBeTruthy();

      await page.reload();
      await quiet09(page);

      // 05 - both teams on the card, with the Friendly badge every new match
      // starts on.
      const card = page.getByText(KB09_TEAMS.rovers, { exact: true }).first();
      await expect(card).toBeVisible({ timeout: 30_000 });
      await expect(onScreen(page.getByText('Friendly', { exact: true })).first()).toBeVisible();
      await parkPointer(page);
      await shot(page, '09.1', '05-both-teams', { mask });

      // 06 - the Leaderboard list. Every match needs one, which is the fact this
      // article has to land: without it the match never leaves Incomplete.
      const form = page.locator('form').filter({ has: page.getByRole('button', { name: 'Save changes' }) }).first();
      await expect(form).toBeVisible();
      const boardTrigger = onScreen(form.getByRole('combobox')).first();
      await boardTrigger.scrollIntoViewIfNeeded();
      await boardTrigger.click();
      const boardOption = onScreen(page.getByText(KB09_LEADERBOARD, { exact: true })).last();
      await expect(boardOption).toBeVisible();
      await shot(page, '09.1', '06-leaderboard-open', { annotate: boardOption, mask });
      await boardOption.click();
      await expect(form.locator('select[name="leaderboard"]')).toHaveValue(fx.leaderboard.id);

      // 07 - the venue box. Clicking it opens your venues; typing searches every
      // venue on Scoryboard.
      const club = form.getByPlaceholder('Select your club');
      await club.click();
      const astro = onScreen(page.getByText(KB09_VENUES.astro.name, { exact: true })).last();
      const park = onScreen(page.getByText(KB09_VENUES.park.name, { exact: true })).last();
      await expect(astro).toBeVisible();
      await expect(park).toBeVisible();
      await shot(page, '09.1', '07-location-club-open', { annotate: astro, mask });
      await astro.click();
      await expect(club).toHaveValue(KB09_VENUES.astro.name);

      // 08 - the date picker. Opens on the month the clock says it is, which is
      // why the clock is frozen. Past days are not greyed out: a match can be
      // dated backwards, which is how one already played gets recorded.
      await form.getByText('Select date', { exact: true }).click();
      await expect(page.getByRole('grid')).toBeVisible();
      const day = dayCell(page, 'Thursday, September 24th, 2026');
      await expect(day).toBeVisible();
      await shot(page, '09.1', '08-date-picker', { annotate: day, mask });
      await day.click();
      await expect(form.getByText('24-09-2026', { exact: true })).toBeVisible();

      // 09 - the start-time picker: hours, a colon, minutes, then AM and PM.
      //
      // Scoped to the popover, not the page. Two copies of the picker are in the
      // DOM, one per layout, and a page-wide `getByText('07')` picked the hidden
      // one: the click did nothing, the hour stayed on its default 01, and the
      // first run of this spec saved a 13:00 kick-off and photographed it.
      const timeTrigger = form.getByText('Select time', { exact: true });
      await timeTrigger.click();
      const popper = onScreen(page.locator('[data-radix-popper-content-wrapper]')).first();
      const pm = popper.getByText('PM', { exact: true });
      await expect(pm).toBeVisible();
      await shot(page, '09.1', '09-start-time', { annotate: pm, mask });
      const columns = popper.locator('div.flex.items-start.justify-center > div');
      await columns.nth(0).getByText('07', { exact: true }).click();
      await columns.nth(2).getByText('00', { exact: true }).click();
      await pm.click();
      await page.keyboard.press('Escape');
      await expect(form.getByText('07:00 PM', { exact: true })).toBeVisible();

      // Duration and team size, then save. The seven fields the match needs are
      // now all present, so Save changes turns it Scheduled.
      await form.getByPlaceholder('60').fill('60');
      await form.locator('select[name="teamSize"]').selectOption('5 VS 5');
      await page.getByRole('button', { name: 'Save changes' }).click();

      // 10 - the match, scheduled. The form is gone and a read-only strip has
      // taken its place, with the line that explains what happens next.
      // Two copies of that line are in the DOM, one per layout.
      await expect(
        onScreen(page.getByText('This match will start automatically at the scheduled time and date.')).first(),
      ).toBeVisible({ timeout: 30_000 });
      const detail = await fx.detail(created!);
      expect(detail.status, 'the match should be Scheduled once all seven fields are set').toBe('Scheduled');
      expect(detail.date, 'the kick-off should be 19:00 London on 24 September').toBe('2026-09-24T18:00:00.000Z');
      await quiet09(page);
      await detailStrip09(page, KB09_VENUES.astro.name);
      // Clipped to the MATCH DETAILS card. detailStrip09 scrolls the venue name
      // into view, which on the first run left the capture showing the FEED panel
      // and its livestream placeholder instead of the match.
      const scheduled = await matchCard09(page);
      await parkPointer(page);
      await shot(page, '09.1', '10-match-scheduled', { clip: scheduled, mask });
    } finally {
      if (created) {
        const status = await fx.cancel(created);
        expect(status, 'the throwaway match must be cancelled').toBe(200);
      }
    }

    // The two seeded fixtures, and nothing else. A leftover would put a third
    // entry on every calendar capture in this collection, including this spec's
    // own first shot on the next run.
    const listed = (await asUser(
      fx.token,
      `/players/${fx.playerId}/matches?includeIncomplete=true&startDate=2026-01-01&endDate=2027-12-31`,
    )).body?.data;
    const rows = listed?.result ?? listed ?? [];
    expect(rows.length, 'Mo should be left with the two seeded fixtures').toBe(2);
  });
});
