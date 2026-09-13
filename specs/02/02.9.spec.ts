// 02.9 - Setting up your padel profile.
//
// Padel is a third profile type beside Player and Referee, and this is the
// article that builds one. Two halves, one session: the settings page that
// writes it, then the profile that reads it back.
//
// --- Why kb-02-padelsetup@ and not Perry -------------------------------
//
// Perry (kb-02-padel@) already plays padel, so there is no "before" on his
// settings page to photograph - and 02.6 and 02.7 photograph his profile, so
// changing him would break two published articles. Pax starts football-only and
// this spec turns him into a padel player, which is the article.
//
// --- The account is REBUILT, not reset ---------------------------------
//
// Measured on staging, 2026-09-13: the four padel fields cannot be unset.
// Omitting them from the full-replace PUT keeps them, `""` is refused by the
// enum, and so is `null`. So rebuildPadelSetup02() deletes the address and
// makes it again. scripts/seed-02.mjs does the same thing; both exist so a run
// that follows a crashed one still works. The id changes every run, which is
// why nothing here is hardcoded.
//
// --- Padel Bio is not on screen when you tick the box -------------------
//
// Ticking Padel reveals the four pickers INLINE, straight away. The second bio
// box does not come with them: `Padel Bio` appears in My Bio only after the
// first save. Shot 05 is taken after the save for that reason, and the article
// says so - a reader who ticks the box and goes looking for it will not find it.
//
// --- The LEVEL panel is empty here, and that is correct -----------------
//
// Pax has no `rating7`, because nothing in 02.9 opens the padel rating
// questionnaire - that is 01.8's article. His LEVEL panel therefore renders its
// title and "Play matches and see how your level changes" and no number. That
// is what a reader sees on the day they tick the box, so it is what shot 06
// shows, and the article sends them to 01.8 for the number.

import { test, expect } from '@playwright/test';
import {
  shot, quiet, blockPromos, signInAs, onlyOurActivities, onScreen,
  rebuildPadelSetup02, pickFromList, padelStatTiles, padelLevelPanel,
  profileSwitch, panel, sidebarIdentity, viewsCount, notificationBadge, centre,
  KB02_PADEL_SETUP, KB02_PADEL_CHOICES,
} from '../../lib/kb';

test.describe('02.9 Setting up your padel profile', () => {
  test('ticking Padel, the four fields it reveals, and the profile it builds', async ({ page }) => {
    const me = await rebuildPadelSetup02();

    await blockPromos(page);
    await onlyOurActivities(page);
    await signInAs(page, me.email, '/profile-settings');
    await quiet(page);
    await expect(page.getByText('First Name *', { exact: true })).toBeVisible();

    const identity = sidebarIdentity(page, 'Pax KB');
    const views = viewsCount(page);
    const badge = notificationBadge(page);

    // 01 - Sports, open, with Padel not yet ticked. The list is the gate: none
    // of the padel fields exists until Padel is in it.
    //
    // Asserted before the capture: the football field is here and the four
    // padel ones are not, which is what makes this the "before" picture.
    await expect(page.getByText('Preferred position *', { exact: true })).toBeVisible();
    for (const label of ['Best hand *', 'Court position', 'Match type', 'Preferred time']) {
      await expect(page.getByText(label, { exact: true })).toHaveCount(0);
    }
    const sports = onScreen(page.getByRole('combobox').filter({ hasText: 'Football' })).first();
    await centre(sports);
    await sports.click();
    const sportsList = onScreen(page.getByRole('listbox')).first();
    await expect(sportsList.getByText('Padel', { exact: true })).toBeVisible();
    await shot(page, '02.9', '01-sports-list', { mask: [identity, views, badge] });

    // Tick Padel in the list that is already open. Not pickFromList(): that
    // opens the combobox first, and clicking the trigger while its own listbox
    // is covering the page is intercepted by the overlay. Cost one run.
    //
    // The list is multi-select and stays open after the tick, so it is
    // dismissed by hand rather than by the click closing it.
    await sportsList.getByText('Padel', { exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox').locator('visible=true')).toHaveCount(0);
    await expect(sports).toContainText('Padel');

    // 02 - the four fields, revealed. Clipped to the block that holds them.
    //
    // Preferred position is still there, and deliberately in frame: Football is
    // still ticked, so this account now carries both sports' fields. An article
    // that showed only the padel four would imply the football one had gone.
    const bestHand = page.locator('label').filter({ hasText: 'Best hand *' })
      .locator('xpath=following-sibling::button[1]');
    const preferredTime = page.locator('label').filter({ hasText: 'Preferred time' })
      .locator('xpath=following-sibling::button[1]');
    await expect(bestHand).toBeVisible();
    // Not clipped. The four fields have no wrapper of their own: the nearest
    // ancestor that holds all four also holds every other field on the form,
    // and a clip of it is a 720x2326 strip running from First Name to the
    // default-profile pills. `ancestor::div[1]` off Best hand is the opposite
    // mistake - one field, on its own, with nothing around it. Both were tried.
    //
    // So this is the viewport, scrolled so the four sit in the middle of it,
    // which is also what docs/style-guide.md asks for: enough surrounding
    // chrome to orient the reader. Preferred position is in frame on purpose -
    // Football is still ticked, so the football field is still there, and a
    // capture that cut it out would imply it had gone.
    await centre(bestHand);
    await expect(preferredTime).toBeVisible();
    await shot(page, '02.9', '02-padel-fields-revealed', {
      mask: [identity, views, badge], annotate: bestHand,
    });

    // 03 - Best hand, open. It is the only one of the four marked required, and
    // the only one with two options rather than three.
    await bestHand.click();
    const handList = onScreen(page.getByRole('listbox')).first();
    await expect(handList.getByText('Left Handed', { exact: true })).toBeVisible();
    await expect(handList.getByText('Right Handed', { exact: true })).toBeVisible();
    await shot(page, '02.9', '03-best-hand-options', { mask: [identity, views, badge] });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox').locator('visible=true')).toHaveCount(0);

    // Fill all four. The values are in lib/fixtures-02.mjs so the profile
    // assertions below cannot drift from what was typed here.
    await pickFromList(page, 'Best hand *', KB02_PADEL_CHOICES.bestHand);
    await pickFromList(page, 'Court position', KB02_PADEL_CHOICES.courtPositions);
    await pickFromList(page, 'Match type', KB02_PADEL_CHOICES.matchType);
    await pickFromList(page, 'Preferred time', KB02_PADEL_CHOICES.preferredTime);

    // 04 - Select your default profile. Two pills now, where a football-only
    // account has one. The padel pill carries no text at all - it is an image
    // with an alt - so it is reached by that and not by a name.
    const defaultProfile = page.locator('[role="radiogroup"]')
      .filter({ has: page.locator('img[alt="Padel profile"]') }).first();
    await centre(defaultProfile);
    await expect(defaultProfile.locator('[role="radio"]')).toHaveCount(2);
    await shot(page, '02.9', '04-default-profile', {
      clip: defaultProfile.locator('xpath=ancestor::div[1]'),
    });

    await page.getByRole('button', { name: 'Save Changes' }).click();

    // 05 - the second bio box. It is NOT on screen before the save, which is
    // the point of taking this shot here: expect.poll rather than a wait on a
    // duration, so the capture follows the save landing rather than a guess.
    await expect.poll(
      async () => page.getByText('Padel Bio', { exact: true }).count(),
      { message: 'Padel Bio should appear in My Bio once the padel fields are saved' },
    ).toBe(1);
    const padelBioBox = page.getByPlaceholder('Add your Padel bio here...');
    await padelBioBox.fill(KB02_PADEL_CHOICES.padelBio);
    const bioSection = padelBioBox.locator('xpath=ancestor::div[2]');
    await centre(bioSection);
    await shot(page, '02.9', '05-padel-bio', {
      clip: bioSection, annotate: padelBioBox, annotatePad: -3,
    });
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect.poll(async () => {
      const r = await fetch(`${process.env.SCORYBOARD_API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${me.token}` },
      });
      return (await r.json())?.data?.padelBio ?? '';
    }).toBe(KB02_PADEL_CHOICES.padelBio);

    // --- the read side -----------------------------------------------------
    //
    // Same session, one navigation. `defaultProfile` is deliberately left on
    // Football: the profile opens on the football side and the reader selects
    // the padel pill, which is what the article tells them to do. 02.6 already
    // photographs a Padel-default account, and photographing a second one here
    // would say nothing new.
    await page.goto(`/player/${me.playerId}`);
    await quiet(page);
    const roleSwitch = profileSwitch(page);
    await expect(roleSwitch.locator('[role="radio"]')).toHaveCount(2);
    await roleSwitch.locator('[role="radio"]')
      .filter({ has: page.locator('img[alt="Padel profile"]') }).click();

    // Asserted before the capture: this is the padel side, so the LEVEL panel
    // and PADEL TOURNAMENTS exist and the football Matches panel does not.
    const level = await padelLevelPanel(page);
    await expect(onScreen(page.getByText('PADEL TOURNAMENTS', { exact: true })).first())
      .toBeVisible();
    await expect(page.locator('main h3').filter({ hasText: /^MATCHES$/i })).toHaveCount(0);

    // 06 - the LEVEL panel with no number in it. Pax has never done the rating
    // questionnaire, so this is what it says on the day you tick the box.
    await expect(level).toContainText('Play matches and see how your level changes');
    await centre(level);
    await shot(page, '02.9', '06-level-panel-empty', { clip: level });

    // 07 - the tile grid. Four of these ten are the answers typed above, read
    // straight back, and they are asserted rather than left to the picture.
    const grid = await padelStatTiles(page);
    for (const value of [
      KB02_PADEL_CHOICES.bestHand,
      KB02_PADEL_CHOICES.courtPositions,
      KB02_PADEL_CHOICES.matchType,
      KB02_PADEL_CHOICES.preferredTime,
    ]) {
      await expect(grid.getByText(value, { exact: true }).first()).toBeVisible();
    }
    await centre(grid);
    await shot(page, '02.9', '07-padel-tiles', { clip: grid });

    // The account is left as the article leaves it: padel ticked, four fields
    // filled, default profile still Football. The next run rebuilds it.
    expect(KB02_PADEL_SETUP.sports).toEqual(['Football']);
  });
});
