// 09.5 - Editing or cancelling a match.
//
// RETITLED. The map called this "Editing, cancelling or deleting a match" and
// there is no delete. The gear menu offers **Configure appearance**, **Edit** and
// **Cancel Match** and nothing else, and the API's own `DELETE /matches/:id`
// answers "Match cancelled successfully" and sets `status: "Cancelled"`, leaving
// the row in place. See briefs/09.md.
//
// docs/style-guide.md, "Actions you can only do once": the Cancel Match window is
// photographed on the seeded fixture **without being submitted**, and the click
// itself happens on a throwaway. So shot 04 is the warning a reader reads, and no
// capture in this collection depends on a match that has been called off.
//
// The Edit dialog prefills from a Scheduled match - leaderboard, both teams,
// date, duration, team size, start time, venue, pitch, game type and note. It
// does NOT on an Incomplete one: there is nothing to prefill, so it opens blank
// with placeholder crests reading YT and OT. Referee never prefills; see 09.6.

import { test, expect } from '@playwright/test';
import {
  shot, signInAs, onScreen, asUser,
  fixtures09, quiet09, freezeClock09, settled09, warm09, detailStrip09,
  openMatchGear, openUpdateMatch, namedDialog09, closeDialog09, matchAddToCalendar,
  sidebarIdentity09, moving09, parkPointer,
  KB09, KB09_VENUES,
} from '../../lib/kb';

test.describe('09.5 Editing or cancelling a match', () => {
  test('the gear menu, the Edit dialog and the Cancel Match warning', async ({ page }) => {
    const fx = await fixtures09();

    await signInAs(page, KB09.pro, `/matches/${fx.match.fixture}`);
    await freezeClock09(page);
    await page.reload();
    await quiet09(page);
    await detailStrip09(page, KB09_VENUES.astro.name);

    const mask = [sidebarIdentity09(page, 'Mo KB'), ...moving09(page)];

    // 01 - the gear menu. Three items, and the third is the only destructive
    // control on the page.
    const menu = await openMatchGear(page);
    await expect(menu.getByText('Configure appearance', { exact: true })).toBeVisible();
    await expect(menu.getByText('Edit', { exact: true })).toBeVisible();
    await shot(page, '09.5', '01-gear-menu', {
      annotate: menu.getByText('Edit', { exact: true }), mask,
    });

    // 02 - the Edit dialog, arriving full. Everything the match already holds is
    // in it, which is what makes it an edit rather than a re-entry.
    await menu.getByText('Edit', { exact: true }).click();
    const dlg = namedDialog09(page, 'Update your match');
    await expect(dlg).toBeVisible();
    await expect(dlg.locator('input[name="clubLocation"]')).toHaveValue(KB09_VENUES.astro.name);
    await expect(dlg.locator('input[name="pitchNumber"]')).toHaveValue('3');
    await expect(dlg.locator('textarea[name="note"]')).not.toHaveValue('');
    await settled09(page);
    await shot(page, '09.5', '02-update-dialog', { clip: dlg, clipPad: 16 });

    // 03 - a field changed, and the button that commits it. Nothing is submitted:
    // the fixture is read by four other specs and 09.3 already photographs a real
    // save on its own throwaway.
    const pitch = dlg.locator('input[name="pitchNumber"]');
    await pitch.fill('4');
    const update = dlg.getByRole('button', { name: 'Update Match' });
    await expect(update).toBeEnabled();
    await shot(page, '09.5', '03-changed-field', { clip: dlg, clipPad: 16, annotate: pitch });
    await closeDialog09(page);
    // Proof the fixture was left alone.
    expect((await fx.detail(fx.match.fixture)).pitchNumber,
      'the fixture must still be on pitch 3 - this spec closed the dialog rather than saving').toBe('3');

    // 04 - the Cancel Match warning, on the fixture, unsubmitted. The wording is
    // the article's subject: "This action cannot be undone."
    const menu2 = await openMatchGear(page);
    await menu2.getByText('Cancel Match', { exact: true }).click();
    const warn = namedDialog09(page, 'Cancel Match');
    await expect(warn).toBeVisible();
    await expect(warn.getByText('This action cannot be undone. This will permanently cancel the match.'))
      .toBeVisible();
    const confirm = warn.getByRole('button', { name: 'Cancel Match' });
    await shot(page, '09.5', '04-cancel-confirm', { clip: warn, clipPad: 24, annotate: confirm });
    await closeDialog09(page);
    expect((await fx.detail(fx.match.fixture)).status,
      'the fixture must still be Scheduled - the warning was photographed, not submitted').toBe('Scheduled');

    // The submit, on a throwaway, so the article can say what happens without the
    // fixture paying for it. No capture: the match simply stops appearing.
    const doomed = await fx.throwaway(fx.teams.united);
    const put = await asUser(fx.token, `/matches/${doomed}`, {
      method: 'PUT',
      body: {
        awayTeam: { teamId: fx.teams.rovers, players: [] },
        date: '2026-09-16T18:00:00.000Z',
        duration: '60 min',
        teamSize: '5 VS 5',
        clubLocationId: await fx.venue('park'),
        leaderboardId: fx.leaderboard.id,
      },
    });
    expect(put.ok, `PUT to complete the throwaway: ${JSON.stringify(put.body)}`).toBeTruthy();
    expect((await fx.detail(doomed)).status).toBe('Scheduled');

    await page.goto(`/matches/${doomed}`);
    await quiet09(page);
    await detailStrip09(page, KB09_VENUES.park.name);
    const doomedMenu = await openMatchGear(page);
    await doomedMenu.getByText('Cancel Match', { exact: true }).click();
    const doomedWarn = namedDialog09(page, 'Cancel Match');
    await expect(doomedWarn).toBeVisible();
    await doomedWarn.getByRole('button', { name: 'Cancel Match' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 30_000 });

    // What Cancel Match actually does, asserted rather than assumed: the row keeps
    // answering, with status Cancelled.
    await expect.poll(async () => (await fx.detail(doomed))?.status, { timeout: 30_000 })
      .toBe('Cancelled');

    const listed = (await asUser(
      fx.token,
      `/players/${fx.playerId}/matches?includeIncomplete=true&startDate=2026-01-01&endDate=2027-12-31`,
    )).body?.data;
    const rows = listed?.result ?? listed ?? [];
    expect(rows.length, 'a Cancelled match leaves every listing, so Mo is back to two').toBe(2);
  });

  // Its own test, so the context starts signed out. Signing a second persona in
  // on top of the first inside one test leaves the mounted app showing the first.
  test('what somebody who only plays for the team sees', async ({ page }) => {
    const fx = await fixtures09();

    // 05 - no gear, so no Edit and no Cancel Match. warm09() first, or the away
    // team, the venue and the referee render as placeholders (see lib/kb.ts).
    await signInAs(page, KB09.player, '/');
    await freezeClock09(page);
    await warm09(page);
    await page.goto(`/matches/${fx.match.fixture}`);
    await quiet09(page);
    await detailStrip09(page, KB09_VENUES.astro.name);
    await expect(page.locator('#show-tour-button')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'START MATCH' })).toHaveCount(0);
    // Pip does keep Add to Calendar - a fixture is worth putting in your own
    // calendar whether or not you run it. What has gone is the gear beside it, so
    // the header holds exactly one menu instead of two.
    const header = matchAddToCalendar(page).locator('xpath=..');
    await expect(header.locator('button[aria-haspopup="menu"]')).toHaveCount(1);
    await settled09(page);
    await parkPointer(page);
    await shot(page, '09.5', '05-player-no-gear', {
      mask: [sidebarIdentity09(page, 'Pip KB'), ...moving09(page)],
    });
  });
});
