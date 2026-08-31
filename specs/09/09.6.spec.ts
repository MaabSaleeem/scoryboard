// 09.6 - Assigning a referee, and adding a banner or note.
//
// Three separate jobs on one match, and one of them cannot be done.
//
// **The referee half is narrowed, deliberately.** The Referee box in the Edit
// dialog searches
// `GET /team-players/search?searchType=referee&tournamentSelectionOnly=true`. That
// parameter narrows the results to referees YOU have saved, and the only call that
// saves one is `POST /tournaments/:id/referee` with `saveForFutureTournaments:
// true` - a tournament call. A football manager with no tournament therefore reads
// "No results found" whatever they type, for ever. Isolated on staging
// 2026-08-31: `isReferee` is a field on the player record and nothing a user can
// reach sets it (`PUT /users/:id {isReferee}` is ignored, `defaultProfile:
// "Referee"` sets a different field, and `PATCH
// /players/:id/referee-settings` answers 403 to anybody but that player).
//
// So shot 01 photographs the empty list - that is what a reader gets - and shot 02
// photographs a match that already has a referee, which the seed put there with
// `PUT /matches/:id {refereePlayerId}`. What this spec must NOT do is stage a
// reader choosing a name out of that list, because no reader can. briefs/09.md,
// open question 1.
//
// The other two are ordinary. **Banner** is the gear menu's Configure appearance
// window - an Upload a cover image tile and a theme list with one entry in it.
// **Note** has two homes: a field in the Edit dialog, and an Edit Note window
// reachable in place on the FEED panel.

import { test, expect } from '@playwright/test';
import {
  shot, signInAs, onScreen, asUser,
  fixtures09, quiet09, freezeClock09, settled09, matchCard09, detailStrip09,
  openUpdateMatch, openConfigureAppearance, namedDialog09, closeDialog09, feedPanel09,
  sidebarIdentity09, moving09, parkPointer,
  KB09, KB09_VENUES, KB09_MATCHES,
} from '../../lib/kb';

const FIXTURE_NOTE = KB09_MATCHES.find((m) => m.key === 'fixture')!.note!;

test.describe('09.6 Assigning a referee, and adding a banner or note', () => {
  test('the empty referee list, and the referee a match already has', async ({ page }) => {
    const fx = await fixtures09();
    // The seed puts Rae on the fixture. Asserted here so a reader of this spec
    // knows shot 02 is not staged: the match really does carry a referee.
    expect((await fx.detail(fx.match.fixture)).refereePlayerId,
      'the seed must have put a referee on the fixture').toBeTruthy();

    // Shot 01 is taken on a throwaway that has NO referee, and that is the whole
    // point. The list is built from the match's own `refereePlayerId` first and
    // your saved referees second, so on the seeded fixture it offers exactly one
    // name - Rae, already on the match - and a reader would think the search
    // works. On a match with no referee, which is every match a reader is about to
    // set up, it reads "No results found". That is the state the article has to
    // show.
    const id = await fx.throwaway(fx.teams.united);
    const put = await asUser(fx.token, `/matches/${id}`, {
      method: 'PUT',
      body: {
        awayTeam: { teamId: fx.teams.rovers, players: [] },
        date: '2026-09-18T18:00:00.000Z',
        duration: '60 min',
        teamSize: '5 VS 5',
        clubLocationId: await fx.venue('astro'),
        leaderboardId: fx.leaderboard.id,
      },
    });
    expect(put.ok, `PUT to complete the throwaway: ${JSON.stringify(put.body)}`).toBeTruthy();

    try {
      await signInAs(page, KB09.pro, `/matches/${id}`);
      await freezeClock09(page);
      await page.reload();
      await quiet09(page);
      await detailStrip09(page, KB09_VENUES.astro.name);

      // 01 - the Referee box, open and empty.
      const dlg = await openUpdateMatch(page);
      const referee = dlg.locator('input[name="referee"]');
      await expect(referee).toHaveValue('');
      await referee.scrollIntoViewIfNeeded();
      await referee.click();
      // Opened cold the list reads "No options available"; typed into, it reads
      // "No results found". The typed state is the one a reader reaches - they know
      // who their referee is and they go looking for them - so the shot is taken
      // with a name in the box. Both strings are asserted, so a change to either
      // fails here rather than in the prose.
      await expect(onScreen(page.getByText(/No options available/i)).last())
        .toBeVisible({ timeout: 30_000 });
      await referee.fill('Rae KB');
      const noResults = onScreen(page.getByText(/No results found/i)).last();
      await expect(noResults).toBeVisible({ timeout: 30_000 });
      await settled09(page);
      await shot(page, '09.6', '01-referee-empty', {
        clip: dlg, clipPad: 16, annotate: noResults,
      });
      await closeDialog09(page);
    } finally {
      expect(await fx.cancel(id), 'the throwaway match must be cancelled').toBe(200);
    }

    // 02 - the referee on the match that has one. First cell in the read-only
    // strip, ahead of the leaderboard and the venue.
    await page.goto(`/matches/${fx.match.fixture}`);
    await quiet09(page);
    await detailStrip09(page, KB09_VENUES.astro.name);
    const mask = [sidebarIdentity09(page, 'Mo KB'), ...moving09(page)];
    const refCell = page.getByText('Rae', { exact: true }).first();
    await expect(refCell).toBeVisible({ timeout: 30_000 });
    const card = await matchCard09(page);
    await parkPointer(page);
    await shot(page, '09.6', '02-strip-referee', { clip: card, annotate: refCell, mask });
  });

  test('the banner window and its one theme', async ({ page }) => {
    const fx = await fixtures09();

    await signInAs(page, KB09.pro, `/matches/${fx.match.fixture}`);
    await freezeClock09(page);
    await page.reload();
    await quiet09(page);
    await detailStrip09(page, KB09_VENUES.astro.name);

    // 03 - Configure appearance. Nothing is uploaded: a banner would change every
    // later capture of this fixture, and the window is the article's subject.
    const dlg = await openConfigureAppearance(page);
    const upload = onScreen(dlg.getByText('Upload a cover image', { exact: true })).first();
    await expect(upload).toBeVisible();
    await expect(dlg.getByText('Select a theme', { exact: true })).toBeVisible();
    await settled09(page);
    await shot(page, '09.6', '03-configure-appearance', {
      clip: dlg, clipPad: 24, annotate: upload,
    });

    // 04 - the theme list. One entry. Worth photographing rather than describing:
    // "pick a theme" implies a choice that is not there.
    const themeTrigger = onScreen(dlg.getByRole('combobox')).first();
    await themeTrigger.click();
    const only = onScreen(page.getByText('Default Theme', { exact: true })).last();
    await expect(only).toBeVisible();
    await shot(page, '09.6', '04-theme-list', { clip: dlg, clipPad: 24, annotate: only });
    await closeDialog09(page);
  });

  test('the note, empty and full', async ({ page }) => {
    const fx = await fixtures09();
    // The second fixture has no note, which is what makes it the right one for
    // shot 05. Asserted, because a stray Save on it would change what shot 05
    // shows without failing anything else.
    expect((await fx.detail(fx.match.second)).note ?? '',
      'the second fixture must have no note').toBe('');

    await signInAs(page, KB09.pro, `/matches/${fx.match.second}`);
    await freezeClock09(page);
    await page.reload();
    await quiet09(page);
    await detailStrip09(page, KB09_VENUES.park.name);

    const mask = [sidebarIdentity09(page, 'Mo KB'), ...moving09(page)];

    // 05 - the FEED panel with no note on it. "No Note added." and an Add Note
    // link; on a match that has one the link reads Edit instead.
    // Not `getByText('No Note added.', {exact: true})`: the line and the link share
    // one element, whose text is "No Note added. Add Note", so an exact match finds
    // nothing. The Add Note button is the reliable handle, and the panel is the
    // rounded box it sits in.
    const addNote = onScreen(page.getByRole('button', { name: 'Add Note', exact: true })).first();
    await expect(addNote).toBeVisible({ timeout: 30_000 });
    // The whole FEED panel, not the note's own box. Clipping to the box gave a
    // 1900x180 strip with no heading on it - true, and unreadable as a step in an
    // article, because nothing in the frame said where on the page it was.
    const feed = await feedPanel09(page);
    await settled09(page);
    await parkPointer(page);
    await shot(page, '09.6', '05-no-note', { clip: feed, clipPad: 24, annotate: addNote, mask });

    // 06 - the Edit Note window, on the fixture that has one, so the counter shows
    // a real number rather than 0/250. Nothing is submitted: 09.5 already proves a
    // save works, and this fixture's note is read by shot 05's sibling article.
    await page.goto(`/matches/${fx.match.fixture}`);
    await quiet09(page);
    await detailStrip09(page, KB09_VENUES.astro.name);
    const editNote = onScreen(page.getByRole('button', { name: 'Edit', exact: true })).first();
    await expect(editNote).toBeVisible({ timeout: 30_000 });
    await editNote.click();
    const dlg = namedDialog09(page, 'Edit Note');
    await expect(dlg).toBeVisible();
    const box = dlg.locator('textarea');
    await expect(box).toHaveValue(FIXTURE_NOTE);
    await expect(dlg.getByText(`${FIXTURE_NOTE.length}/250`, { exact: true })).toBeVisible();
    const save = dlg.getByRole('button', { name: 'Save', exact: true });
    await settled09(page);
    await shot(page, '09.6', '06-edit-note', { clip: dlg, clipPad: 24, annotate: save });
    await closeDialog09(page);

    expect((await fx.detail(fx.match.fixture)).note,
      'the fixture note must be untouched - this spec closed the window rather than saving')
      .toBe(FIXTURE_NOTE);
  });
});
