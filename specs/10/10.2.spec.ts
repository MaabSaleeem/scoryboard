// 10.2 - Picking your lineup and choosing a formation.
//
// Flagged `free_pro` and `role`, and both flags land in the same place: the
// substitutes' bench.
//
// **The Free limit is three substitutes**, and the app shows it by drawing SUB-4
// in violet where SUB-1 to SUB-3 are blue. Selecting it on Free opens **Add More
// Subs** instead of the player list. The gate reads the **signed-in user's**
// membership, not the team owner's - so Ada, a Free Administrator on Mo's Pro
// team, hits it. That is why this article needs no membership flip: Mo is Pro at
// rest and Ada is Free at rest (docs/style-guide.md).
//
// **A team player sees the panel and cannot touch it.** No formation control, no
// places to fill, no bench.
//
// Two things this spec is careful about.
//
// **It does not change the fixture's formation.** Choosing a formation saves it,
// and a spec that mutates a fixture has to put it back. Shot 09 uses a throwaway
// Scheduled match instead, which is cheaper than a repair and cannot leave the
// fixture half-changed.
//
// **A substitute slot's label is not clickable.** Only the `+` beside it carries
// the handler, which is what subSlot() returns. Clicking the label does nothing
// at all and looks exactly like a slot that refuses to open.

import { test, expect } from '@playwright/test';
import {
  shot, signInAs, onScreen, parkPointer,
  fixtures10, openMatch10, settled10, matchPanel, matchDialog10, closeDialog10,
  pitchColumn, substitutesBlock, subSlot, formationSelect, gate10,
  sidebarIdentity10, moving10,
  KB10, KB10_TEAMS, KB10_SQUADS,
} from '../../lib/kb';

test.describe('10.2 Picking your lineup and choosing a formation', () => {
  test('the pitch, the formation list and the bench, as the owner', async ({ page }) => {
    const fx = await fixtures10();
    await signInAs(page, KB10.pro, '/');
    await openMatch10(page, fx.scheduled, fx.frozenNow);

    const mask = [sidebarIdentity10(page, 'Mo KB'), ...moving10(page)];
    const column = await pitchColumn(page, 'home');

    // All five starters must have drawn. A position a formation uses twice has to
    // carry its index - `CenterBack-1` and `CenterBack-2`, not `CenterBack`
    // twice - or the board keys both to one slot and draws neither player. This
    // is the assertion that would catch that coming back.
    for (const name of KB10_SQUADS.united.lineup) {
      const label = name === 'Mo KB' ? 'Mo' : name;
      await expect(column.getByText(label, { exact: true }).first()).toBeVisible();
    }

    // 01 - one team's half of the panel: the formation control, the pitch, the
    // bench. The whole LINEUP panel is 1,645 pixels tall because each team's half
    // is a row of [Team Members][pitch column], so the panel-wide view belongs to
    // 10.1 and this article works in the column.
    await parkPointer(page);
    await shot(page, '10.2', '01-your-pitch', { clip: column, clipPad: 8, mask });

    // 02 - the formation list. Six shapes are on screen and the list scrolls; the
    // one in use carries a tick.
    const formation = formationSelect(page, 'home');
    await formation.scrollIntoViewIfNeeded();
    await formation.click();
    const list = page.getByText('Select your formation', { exact: true });
    await expect(list).toBeVisible({ timeout: 30_000 });
    for (const shape of ['2-1-1', '1-2-1', '1-1-2']) {
      await expect(onScreen(page.getByText(shape, { exact: true })).last()).toBeVisible();
    }
    await parkPointer(page);
    await shot(page, '10.2', '02-formation-open', { mask });
    await page.keyboard.press('Escape');
    await expect(list).toBeHidden();

    // 03 - Select Player, opened from the first empty bench slot. Every place on
    // the pitch is filled on this fixture, and it is the same window either way:
    // Select against a squad member who is not in, Remove against one who is.
    await subSlot(page, 1).scrollIntoViewIfNeeded();
    await subSlot(page, 1).click();
    const picker = matchDialog10(page, 'Select Player');
    await expect(picker.first()).toBeVisible({ timeout: 30_000 });
    await expect(picker.getByText('Add new player', { exact: true }).first()).toBeVisible();
    await parkPointer(page);
    await shot(page, '10.2', '03-select-player', {
      clip: picker.first(), clipPad: 16, mask,
    });
    await closeDialog10(page);

    // 04 - the bench. Four slots, and SUB-4 is the one the Free limit is on.
    const bench = substitutesBlock(column);
    await expect(bench.getByText('SUB-4', { exact: true })).toBeVisible();
    await parkPointer(page);
    await shot(page, '10.2', '04-substitutes', {
      clip: bench, clipPad: 10, annotate: bench.getByText('SUB-4', { exact: true }), mask,
    });

    // 05 - the squad this line-up is picked from, with its role markers.
    const members = onScreen(
      matchPanel(page, 'lineup').getByText(/^Team Members \(\d+\)$/),
    ).first();
    await expect(members).toBeVisible();
    const membersBlock = members.locator('xpath=..');
    await parkPointer(page);
    await shot(page, '10.2', '05-team-members', { clip: membersBlock, clipPad: 8, mask });

    // 07 - the Pro half of the dual capture. Same SUB-4, and on Pro it just opens
    // the player list. Captured here rather than in the Free test so the two
    // halves are one window apart and nothing has to be flipped.
    await subSlot(page, 4).scrollIntoViewIfNeeded();
    await subSlot(page, 4).click();
    const proPicker = matchDialog10(page, 'Select Player');
    await expect(proPicker.first()).toBeVisible({ timeout: 30_000 });
    await parkPointer(page);
    await shot(page, '10.2', '07-sub-slot-pro', {
      clip: proPicker.first(), clipPad: 16, mask,
    });
    await closeDialog10(page);
  });

  // A test of its own, and not a fifth act above. Playwright gives each test a
  // fresh context; signing a second persona in on top of the first inside one
  // test does not reliably swap the app's view, because the Firebase session
  // lives in IndexedDB and the mounted React tree keeps the old user.
  test('the fourth substitute on Free', async ({ page }) => {
    const fx = await fixtures10();
    await signInAs(page, KB10.admin, '/');
    await openMatch10(page, fx.scheduled, fx.frozenNow);

    const mask = [sidebarIdentity10(page, 'Ada KB'), ...moving10(page)];

    // Ada is Free and an Administrator, so she may edit the line-up. SUB-1 opens
    // the player list normally - asserted, because the article says the first
    // three are the same on both plans and that claim needs proving.
    await subSlot(page, 1).scrollIntoViewIfNeeded();
    await subSlot(page, 1).click();
    await expect(matchDialog10(page, 'Select Player').first()).toBeVisible({ timeout: 30_000 });
    await closeDialog10(page);

    // 06 - the Free half. SUB-4 opens the gate instead.
    await subSlot(page, 4).scrollIntoViewIfNeeded();
    await subSlot(page, 4).click();
    const dlg = await gate10(page, 'Add More Subs');
    await expect(
      dlg.getByText('Upgrade to Pro Membership to add more substitutes to your lineup.'),
    ).toBeVisible();
    await parkPointer(page);
    await shot(page, '10.2', '06-sub-limit-free', { clip: dlg, clipPad: 24, mask });
    await closeDialog10(page);
  });

  test('what a team player sees', async ({ page }) => {
    const fx = await fixtures10();
    await signInAs(page, KB10.player, '/');
    await openMatch10(page, fx.scheduled, fx.frozenNow);

    // The role half, stated as absences. Pip is on KB 10 United and does not run
    // it: the panel is there and nothing in it can be touched.
    const lineup = matchPanel(page, 'lineup');
    await expect(lineup.getByText(KB10_TEAMS.united, { exact: true }).first()).toBeVisible();
    // What a team player lacks, named one control at a time. Two guesses were
    // wrong before this list was right, and both are worth recording because they
    // are the same mistake: asserting the *drawing* is absent rather than the
    // *controls*.
    //
    //   run 1: SUB-1 is absent            - it is not. All four slots are drawn.
    //   run 2: no div.cursor-pointer      - there are 72. Every avatar has one.
    //
    // The panel is a full read-only copy: the pitches, the benches and both
    // squads are all there. What is missing is the Formation control, the
    // Add Player button and the Invite links.
    await expect(onScreen(lineup.getByRole('combobox'))).toHaveCount(0);
    await expect(lineup.getByRole('button', { name: 'Add Player' })).toHaveCount(0);
    await expect(lineup.getByRole('button', { name: 'Invite' })).toHaveCount(0);
    await expect(lineup.getByText('SUB-1', { exact: true }).first()).toBeVisible();
    await settled10(page);

    // 08 - the read-only panel.
    await parkPointer(page);
    await shot(page, '10.2', '08-player-view', {
      clip: lineup,
      mask: [sidebarIdentity10(page, 'Pip KB'), ...moving10(page)],
    });
  });

  test('changing the formation redraws the pitch', async ({ page }) => {
    const fx = await fixtures10();
    // A throwaway, because choosing a formation saves it. The fixture keeps its
    // 2-1-1 and nothing has to be put back.
    const t = await fx.throwaway('scheduled');
    try {
      await signInAs(page, KB10.pro, '/');
      await openMatch10(page, t.id, fx.frozenNow);

      const mask = [sidebarIdentity10(page, 'Mo KB'), ...moving10(page)];
      const formation = formationSelect(page, 'home');
      await formation.scrollIntoViewIfNeeded();
      await expect(formation).toContainText('2-1-1');
      await formation.click();
      const option = onScreen(page.getByText('1-2-1', { exact: true })).last();
      await expect(option).toBeVisible();
      await option.click();

      // Proved on the API rather than on the pixels: the shape is saved on the
      // match, and a redraw that had not saved would be a different article.
      await expect
        .poll(async () => (await fx.detail(t.id))?.homeTeam?.formation, { timeout: 30_000 })
        .toBe('1-2-1');

      await page.reload();
      await settled10(page);
      const column = await pitchColumn(page, 'home');
      await expect(formationSelect(page, 'home')).toContainText('1-2-1');

      // 09 - the pitch in its new shape.
      await parkPointer(page);
      await shot(page, '10.2', '09-formation-changed', {
        clip: column, clipPad: 8, annotate: formationSelect(page, 'home'), mask,
      });
    } finally {
      expect(await fx.cancel(t.id), 'the throwaway must be cancelled').toBe(200);
    }
  });
});
