// 09.2 - Match statuses, and why a match is stuck on Incomplete.
//
// The article's whole subject is one screen state: a match that exists but is not
// finished, showing up on a team's fixture list as dashes and a **Finish Setup**
// button.
//
// This spec builds that state rather than using a fixture, and it has to: **the
// change is one-way.** Once a venue and a leaderboard are on a match they cannot
// be taken off - `PUT {clubLocationId: null}` and `{leaderboardId: null}` are both
// refused - so a spec that completed a shared fixture would leave the next run
// nothing to photograph. It creates its own Incomplete match, completes it,
// photographs both states, and cancels it in a `finally`.
//
// The seven fields that decide Incomplete versus Scheduled are asserted here, not
// just described: shot 03 is taken with all seven set and the spec checks the
// status flipped.

import { test, expect } from '@playwright/test';
import {
  shot, signInAs, onScreen, asUser,
  fixtures09, quiet09, freezeClock09, settled09, matchCard09, detailStrip09, fixtureCard09,
  sidebarIdentity09, moving09, parkPointer, dayCell,
  KB09, KB09_TEAMS, KB09_LEADERBOARD, KB09_VENUES,
} from '../../lib/kb';

test.describe('09.2 Match statuses, and why a match is stuck on Incomplete', () => {
  test('a half-built match, and finishing its setup', async ({ page }) => {
    const fx = await fixtures09();
    // Home team and away team only. Five of the seven fields are missing, which
    // is exactly what a reader who closed the tab after Create Match is left with.
    const half = await fx.throwaway(fx.teams.united);
    const put = await asUser(fx.token, `/matches/${half}`, {
      method: 'PUT', body: { awayTeam: { teamId: fx.teams.rovers, players: [] } },
    });
    expect(put.ok, `PUT awayTeam: ${JSON.stringify(put.body)}`).toBeTruthy();
    expect((await fx.detail(half)).status).toBe('Incomplete');

    try {
      await signInAs(page, KB09.pro, `/teams/${fx.teams.united}`);
      await freezeClock09(page);
      await page.reload();
      await quiet09(page);

      const mask = [sidebarIdentity09(page, 'Mo KB'), ...moving09(page)];

      // 01 - the team's fixture list, with the unfinished match above the finished
      // one. Dashes where the date, the time and the venue should be, and Finish
      // Setup where Add to Calendar is on the row below.
      await expect(page.getByText('UPCOMING MATCHES')).toBeVisible({ timeout: 30_000 });
      const finishSetup = onScreen(page.getByRole('button', { name: 'Finish Setup' })).first();
      await expect(finishSetup).toBeVisible({ timeout: 30_000 });
      // Both cards in one frame: the contrast is the shot. Scoped to the panel
      // that holds them, not the page, so the team's statistics stay out of it.
      const upcoming = page.getByText('UPCOMING MATCHES')
        .locator('xpath=ancestor::div[contains(@class,"bg-white")][1]');
      await settled09(page);
      await parkPointer(page);
      await shot(page, '09.2', '01-team-finish-setup', {
        clip: upcoming, annotate: finishSetup, mask,
      });

      // 02 - the form Finish Setup lands on. Every field that is still empty is
      // one of the seven, and the Leaderboard is the one nobody expects.
      await finishSetup.click();
      await page.waitForURL(new RegExp(`/matches/${half}$`), { timeout: 30_000 });
      await quiet09(page);
      const form = page.locator('form')
        .filter({ has: page.getByRole('button', { name: 'Save changes' }) }).first();
      await expect(form).toBeVisible({ timeout: 30_000 });
      const boardTrigger = onScreen(form.getByRole('combobox')).first();
      await expect(form.getByText('Select leaderboard', { exact: true })).toBeVisible();
      await expect(form.getByPlaceholder('Select your club')).toHaveValue('');
      const card = await matchCard09(page);
      await parkPointer(page);
      await shot(page, '09.2', '02-incomplete-form', { clip: card, annotate: boardTrigger, mask });

      // Fill in the five that are missing.
      await boardTrigger.click();
      await onScreen(page.getByText(KB09_LEADERBOARD, { exact: true })).last().click();
      await expect(form.locator('select[name="leaderboard"]')).toHaveValue(fx.leaderboard.id);

      const club = form.getByPlaceholder('Select your club');
      await club.click();
      await onScreen(page.getByText(KB09_VENUES.astro.name, { exact: true })).last().click();
      await expect(club).toHaveValue(KB09_VENUES.astro.name);

      // 10 September, which is BEFORE both seeded fixtures on purpose. The team's
      // UPCOMING MATCHES panel shows the next two and hides the rest behind See
      // All, so a match dated after them is not on the page to photograph. Dating
      // this one first puts it at the top of the list.
      await form.getByText('Select date', { exact: true }).click();
      await dayCell(page, 'Thursday, September 10th, 2026').click();
      await expect(form.getByText('10-09-2026', { exact: true })).toBeVisible();

      await form.getByText('Select time', { exact: true }).click();
      const popper = onScreen(page.locator('[data-radix-popper-content-wrapper]')).first();
      const columns = popper.locator('div.flex.items-start.justify-center > div');
      await columns.nth(0).getByText('07', { exact: true }).click();
      await columns.nth(2).getByText('30', { exact: true }).click();
      await popper.getByText('PM', { exact: true }).click();
      await page.keyboard.press('Escape');
      await expect(form.getByText('07:30 PM', { exact: true })).toBeVisible();

      await form.getByPlaceholder('60').fill('60');
      await form.locator('select[name="teamSize"]').selectOption('5 VS 5');

      // 03 - all seven filled in, and the button that commits them.
      const save = page.getByRole('button', { name: 'Save changes' });
      const filled = await matchCard09(page);
      await parkPointer(page);
      await shot(page, '09.2', '03-form-filled', { clip: filled, annotate: save, mask });

      // 04 - the match is Scheduled. The form has gone and the read-only strip has
      // taken its place, with the line that says what happens at kick-off.
      await save.click();
      await expect(
        onScreen(page.getByText('This match will start automatically at the scheduled time and date.')).first(),
      ).toBeVisible({ timeout: 30_000 });
      expect((await fx.detail(half)).status,
        'all seven fields are set, so the match should have left Incomplete').toBe('Scheduled');
      await quiet09(page);
      await detailStrip09(page, KB09_VENUES.astro.name);
      const scheduled = await matchCard09(page);
      await parkPointer(page);
      await shot(page, '09.2', '04-now-scheduled', { clip: scheduled, mask });

      // 05 - the same team card, now a fixture. Dashes replaced by the date, the
      // time and the venue, and Finish Setup replaced by Add to Calendar.
      await page.goto(`/teams/${fx.teams.united}`);
      await quiet09(page);
      await expect(page.getByText('UPCOMING MATCHES')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByRole('button', { name: 'Finish Setup' })).toHaveCount(0);
      // Matched on a regular expression, not the exact string: the card writes the
      // day without a leading zero and the month abbreviated, and neither is worth
      // pinning. 10 September belongs to this match alone - the seeded fixtures
      // are on the 24th and the 30th.
      const repaired = await fixtureCard09(page, /10 Sep/);
      await settled09(page);
      await parkPointer(page);
      await shot(page, '09.2', '05-team-card-complete', { clip: repaired, annotate: repaired, annotatePad: -2, mask });
    } finally {
      const status = await fx.cancel(half);
      expect(status, 'the throwaway match must be cancelled').toBe(200);
    }

    const listed = (await asUser(
      fx.token,
      `/players/${fx.playerId}/matches?includeIncomplete=true&startDate=2026-01-01&endDate=2027-12-31`,
    )).body?.data;
    const rows = listed?.result ?? listed ?? [];
    expect(rows.length, 'Mo should be left with the two seeded fixtures').toBe(2);
  });
});
