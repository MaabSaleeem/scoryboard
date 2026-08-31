// 09.3 - Venue, date, kick-off time, duration and pitch.
//
// All five live in the gear menu's **Edit** dialog, "Update your match", and one
// of them lives ONLY there: the inline MATCH DETAILS form on an Incomplete match
// has no **Pitch number** field at all. So this article works in the dialog, which
// is also the only way to change any of it once the match is Scheduled.
//
// The spec works on its own throwaway - complete and Scheduled, so the dialog
// prefills the way a reader's would - and cancels it in a `finally`. The seeded
// fixtures are never touched: a venue cannot be taken off a match, so a mutation
// there would be permanent.

import { test, expect } from '@playwright/test';
import {
  shot, signInAs, onScreen, asUser,
  fixtures09, quiet09, freezeClock09, settled09, matchCard09, detailStrip09,
  openUpdateMatch, dialog09, sidebarIdentity09, moving09, parkPointer, dayCell,
  KB09, KB09_VENUES,
} from '../../lib/kb';

test.describe('09.3 Venue, date, kick-off time, duration and pitch', () => {
  test('set the where and the when in the Update your match dialog', async ({ page }) => {
    const fx = await fixtures09();
    const astro = await fx.venue('astro');
    const park = await fx.venue('park');

    // A complete match at KB 09 Astro on 12 September, so the dialog prefills and
    // the article can move it to KB 09 Park on the 30th. Both dates are before the
    // seeded fixtures or between them, which keeps the team's UPCOMING MATCHES
    // panel showing this one.
    const made = await asUser(fx.token, '/matches', {
      method: 'POST',
      body: {
        homeTeam: { teamId: fx.teams.united, formation: '2-1-1', players: [] },
        awayTeam: { teamId: fx.teams.rovers, formation: '2-1-1', players: [] },
        date: '2026-09-12T18:00:00.000Z',
        duration: '60 min',
        teamSize: '5 VS 5',
        clubLocationId: astro,
        leaderboardId: fx.leaderboard.id,
        tag: 'friendly',
      },
    });
    expect(made.ok, `POST /matches: ${JSON.stringify(made.body)}`).toBeTruthy();
    const id: string = made.body.data.id;
    expect((await fx.detail(id)).status).toBe('Scheduled');

    try {
      await signInAs(page, KB09.pro, `/matches/${id}`);
      await freezeClock09(page);
      await page.reload();
      await quiet09(page);
      await detailStrip09(page, KB09_VENUES.astro.name);

      const mask = [sidebarIdentity09(page, 'Mo KB'), ...moving09(page)];

      const dlg = await openUpdateMatch(page);

      // 01 - the dialog with STEP 3 in view: the block that holds all five.
      // Clipped to the whole window rather than to the STEP 3 block, because the
      // block has no container of its own - the dialog lays its fields out in one
      // two-column grid and STEP 3 is only a label inside it. Every field with a * beside it
      // is one the match cannot do without.
      await expect(dlg.locator('input[name="pitchNumber"]')).toBeVisible();
      await expect(dlg.getByText('Pitch number', { exact: true })).toBeVisible();
      await settled09(page);
      await shot(page, '09.3', '01-step-3', { clip: dlg, clipPad: 16 });

      // 02 - the venue list. The box arrives holding the match's current venue, so
      // clearing it is what shows the others.
      const club = dlg.locator('input[name="clubLocation"]');
      await expect(club).toHaveValue(KB09_VENUES.astro.name);
      // Click first, then clear with the keyboard. `fill('')` opens the suggestion
      // list as a side effect, and the list covers the box - so a click after the
      // fill waits twenty seconds for an element it is standing on top of.
      await club.scrollIntoViewIfNeeded();
      await club.click();
      await club.press('ControlOrMeta+a');
      await club.press('Backspace');
      await expect(club).toHaveValue('');
      const parkOption = onScreen(page.getByText(KB09_VENUES.park.name, { exact: true })).last();
      await expect(parkOption).toBeVisible();
      await expect(onScreen(page.getByText('Create club location', { exact: true })).last()).toBeVisible();
      await shot(page, '09.3', '02-location-club', { clip: dlg, clipPad: 16, annotate: parkOption });
      await parkOption.click();
      await expect(club).toHaveValue(KB09_VENUES.park.name);

      // 03 - the date picker. It opens on the month the clock says it is, and
      // today is ringed. Nothing before today is greyed out: a match can be dated
      // backwards, which is how one already played gets recorded.
      await dlg.getByText('12-09-2026', { exact: true }).click();
      await expect(page.getByRole('grid')).toBeVisible();
      const day = dayCell(page, 'Wednesday, September 30th, 2026');
      await expect(day).toBeVisible();
      await expect(dayCell(page, 'Today, Tuesday, September 1st, 2026')).toBeVisible();
      await shot(page, '09.3', '03-date-picker', { clip: dlg, clipPad: 16, annotate: day });
      await day.click();
      await expect(dlg.getByText('30-09-2026', { exact: true })).toBeVisible();

      // 04 - the start-time picker: hours, minutes, then AM and PM. Scoped to the
      // popover, because two copies of it are in the DOM, one per layout.
      await dlg.getByText('07:00 PM', { exact: true }).click();
      const popper = onScreen(page.locator('[data-radix-popper-content-wrapper]')).first();
      const columns = popper.locator('div.flex.items-start.justify-center > div');
      await expect(columns.nth(2)).toBeVisible();
      await shot(page, '09.3', '04-start-time', { clip: dlg, clipPad: 16, annotate: columns.nth(2) });
      await columns.nth(0).getByText('08', { exact: true }).click();
      await columns.nth(2).getByText('15', { exact: true }).click();
      await popper.getByText('PM', { exact: true }).click();
      await page.keyboard.press('Escape');
      await expect(dlg.getByText('08:15 PM', { exact: true })).toBeVisible();

      // 05 - duration and pitch, the two you type. Pitch number is free text and
      // it exists nowhere else in the app.
      const duration = dlg.locator('input[name="duration"]');
      const pitch = dlg.locator('input[name="pitchNumber"]');
      await duration.fill('90');
      await pitch.fill('2');
      await shot(page, '09.3', '05-duration-pitch', {
        clip: dlg, clipPad: 16, annotate: pitch,
      });

      // 06 - saved. Everything the article set is in the read-only strip: date,
      // venue, pitch, kick-off, team size and duration.
      await dlg.getByRole('button', { name: 'Update Match' }).click();
      await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 30_000 });
      await expect(page.getByText(KB09_VENUES.park.name, { exact: true }).first())
        .toBeVisible({ timeout: 30_000 });
      const saved = await fx.detail(id);
      expect(saved.pitchNumber).toBe('2');
      expect(saved.duration).toBe('90 min');
      expect(saved.date, 'the kick-off should be 20:15 London on 30 September')
        .toBe('2026-09-30T19:15:00.000Z');
      await quiet09(page);
      const card = await matchCard09(page);
      await parkPointer(page);
      await shot(page, '09.3', '06-saved-strip', { clip: card, mask });
    } finally {
      const status = await fx.cancel(id);
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
