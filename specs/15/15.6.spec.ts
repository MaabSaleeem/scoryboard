// 15.6 - Sponsors on your tournament.
//
// RETITLED from "Sponsors and prizes", and the prizes half is DROPPED.
//
// The board tab labelled PRIZES holds no prizes. It is a **Winner** panel, and
// its picker does not work: the Select winner dialog lists the teams, clicking
// one records nothing, and Save Winner stays disabled, so a winner can never be
// saved. Established, not guessed - the option receives a full trusted click
// sequence and the listbox does not even close, while the identical click on the
// Group component's Select in the slideshow editor moves it from "Select group"
// to "Group A". config/api.md, "The Prizes tab is a Winner panel, and its picker
// does not work", carries the whole finding, and briefs/15.md raises it for the
// reviewer. Writing the steps for a control that cannot be completed would be
// documenting a defect as a feature, so this article covers sponsors only.
//
// Fixtures: KB 15 New Cup for the empty state, KB 15 Cup for the two sponsors -
// one with a banner, one without, because a sponsor with no banner falls back to
// its initials and a reader needs to see both.
//
// The spec opens the Add Sponsor dialog and cancels it. The sponsors themselves
// are seeded: adding one from the dialog would put a third sponsor on the fixture
// on every run, and the sponsors are also referenced by the slide show's Sponsors
// component, which counts them.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures15, freezeClock15, centre, onScreen,
  board15Ready, openDialog, cancelDialog, publicContext, openPublicPage,
  openSlideshow, slideOnScreen, slideshowClock, KB15_SPONSORS,
} from '../../lib/kb';

test.describe('15.6 Sponsors on your tournament', () => {
  test('the empty tab, the dialog, the list, and where sponsors show up',
    async ({ page, browser }) => {
      const fx = await fixtures15();
      const identity = page.getByText('Oona KB', { exact: true });

      // A tournament with no sponsors says what the feature is for.
      await signInAs(page, fx.email, `/tournaments/${fx.newCup}/sponsor`);
      await freezeClock15(page);
      await quiet(page);
      const addEmpty = page.getByRole('button', { name: 'Add Sponsor', exact: true });
      await board15Ready(page, onScreen(page.getByText('No Sponsors Yet', { exact: true })).first());
      await shot(page, '15.6', '01-sponsor-tab-empty', {
        mask: [identity], annotate: addEmpty,
      });

      await addEmpty.click();
      const dialog = openDialog(page);
      await expect(dialog.getByText('Add Sponsor', { exact: true })).toBeVisible();
      // Name is the only required field; the banner, the link and the
      // description are all optional, and the description counts to 180.
      await expect(dialog.getByPlaceholder('Enter sponsor name')).toBeVisible();
      await expect(dialog.getByPlaceholder('https://example.com')).toBeVisible();
      await expect(dialog.getByText('0/180')).toBeVisible();
      await shot(page, '15.6', '02-add-sponsor-dialog', { clip: dialog, clipPad: 24 });
      // Cancelled. The two sponsors this collection uses are seeded, so that the
      // list, the public page and the Sponsors slide all agree on what exists.
      await cancelDialog(page);

      // The list, with a banner on one row and initials on the other.
      await page.goto(`/tournaments/${fx.cup}/sponsor`);
      await board15Ready(page, onScreen(page.getByText(KB15_SPONSORS[0], { exact: true })).first());
      await expect(onScreen(page.getByText(KB15_SPONSORS[1], { exact: true })).first())
        .toBeVisible();
      // The banner is fetched separately and rendered from a blob, so the row's
      // NAME appears a good two seconds before its picture does. The first pass
      // of this capture came back with both sponsors showing initials, which is
      // the opposite of what the article says. Wait for the image itself.
      //
      // onScreen, because the row renders a wide-layout copy and a narrow-layout
      // copy of the same <img> and gives the unused one a zero-width box.
      await expect(onScreen(page.getByRole('img', { name: KB15_SPONSORS[0] })).first())
        .toBeVisible({ timeout: 30_000 });
      await quiet(page);
      await shot(page, '15.6', '03-sponsor-list', { mask: [identity] });

      const ctx = await publicContext(browser);
      const out = await ctx.newPage();
      try {
        // Where a spectator meets them: a row above the tab strip on the public
        // page, each card a LINK to the sponsor's own address.
        //
        // Located by those links, not by the names: a sponsor with a banner
        // renders the banner and its name is only the img's alt text, while a
        // sponsor without one renders initials. Neither puts the name in the
        // page's text, so getByText finds nothing.
        await openPublicPage(out, fx.cup, 'info');
        const astro = out.locator('a[href="https://example.com/kb-astro"]');
        await expect(astro).toBeVisible({ timeout: 30_000 });
        await expect(out.getByRole('img', { name: KB15_SPONSORS[0] })).toBeVisible();
        const strip = astro
          .locator('xpath=ancestor::div[.//a[@href="https://example.com/kb-riverside"]][1]');
        await expect(strip).toBeVisible();
        await shot(out, '15.6', '04-sponsors-on-public-page', { clip: strip, clipPad: 16 });

        // And on the venue screen, if the slide show has a Sponsors slide. The
        // show turns its own slides, so this waits for that slide as a condition.
        await openSlideshow(out, fx.cup);
        await slideOnScreen(out, out.getByRole('img', { name: KB15_SPONSORS[0] }).first());
        await shot(out, '15.6', '05-sponsors-slide', { mask: [slideshowClock(out)] });
      } finally {
        await ctx.close();
      }
    });
});
