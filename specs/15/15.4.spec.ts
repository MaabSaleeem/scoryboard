// 15.4 - Building a match-day slideshow.
//
// Fixture: KB 15 Cup, whose slide show the seed writes over the API - five
// slides carrying one of every component type that needs no extra work plus the
// three that do (group, bracket, sponsor).
//
// Why the seed builds it and not this spec: the editor is the article's SUBJECT,
// not its fixture. A spec that had to assemble five slides before it could
// photograph one would be a spec whose captures depend on twenty clicks landing
// in order, and the ids the editor generates carry a timestamp and a random
// suffix, which docs/style-guide.md forbids in a fixture.
//
// **This spec never saves successfully, and that is deliberate.** The last
// capture is the validation list, which needs a component with its own field
// left empty. An empty Text component is exactly that, so Save is pressed and
// refused. Everything the spec adds is client-side until a successful Save, so
// the fixture the other articles photograph is untouched - asserted at the end.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures15, freezeClock15, centre, onScreen,
  board15Ready, presentationSubTab,
} from '../../lib/kb';

test.describe('15.4 Building a match-day slideshow', () => {
  test('the slide show, its background, its slides and its components',
    async ({ page }) => {
      const fx = await fixtures15();
      const before = JSON.stringify((await fx.detail(fx.cup)).presentation?.slideshows ?? []);

      await signInAs(page, fx.email, `/tournaments/${fx.cup}/presentation`);
      await freezeClock15(page);
      await quiet(page);
      await board15Ready(page, onScreen(page.getByText('Public tabs', { exact: true })).first());

      await presentationSubTab(page, 'Slideshow');
      await expect(onScreen(page.getByText('Slide shows', { exact: true })).first())
        .toBeVisible({ timeout: 30_000 });
      const identity = page.getByText('Oona KB', { exact: true });

      await shot(page, '15.4', '01-slideshow-sub-tab', { mask: [identity] });

      // The card that owns the whole feature, and the two controls on it: one
      // opens what a screen would show, the other starts a second show.
      const showsCard = onScreen(page.getByText('Slide shows', { exact: true })).first()
        .locator('xpath=ancestor::div[.//button][1]');
      const add = page.getByRole('button', { name: 'Add Slideshow', exact: true });
      await centre(showsCard);
      await shot(page, '15.4', '02-slide-shows-card', {
        clip: showsCard, clipPad: 12, annotate: add,
      });

      // Which show you are editing. One show today, so the picker holds one
      // entry - and that is worth showing, because the count above it is what
      // tells a reader a second show is possible at all.
      // Every label on this screen is upper case by CSS and title case in the
      // markup - "Slide show", "Theme", "Cards", "Image". Matching the rendered
      // string finds nothing, which is the trap collections 01 and 14 hit too.
      const picker = onScreen(page.getByText('1 total', { exact: true })).first()
        .locator('xpath=ancestor::div[.//*[@role="combobox"]][1]');
      await centre(picker);
      await shot(page, '15.4', '03-which-slide-show', { clip: picker, clipPad: 12 });

      // The show's own settings, whole: its name, the three switches that decide
      // what the screen shows around the slides, and the background. 05 and 06
      // then crop into the background for the two steps that need pointing at.
      // The name field and all three switches. It is a <section>, and the only
      // one holding both the name label and the switches - which is why two
      // earlier attempts missed: the first ancestor with an input is the whole
      // 1800-pixel panel, and the two "Show ..." labels alone bound just the
      // switch row, without the name field or Active. The section's foot carries
      // the Background heading; 05 is the colour controls under it.
      const switchesCard = page.locator('section')
        .filter({ hasText: 'Slide show name' })
        .filter({ hasText: 'Show current time' })
        .last();
      await expect(switchesCard).toBeVisible();
      await centre(switchesCard);
      await shot(page, '15.4', '04-slide-show-settings', { clip: switchesCard, clipPad: 12 });

      // Background: two colours, a transparency switch and an opacity slider.
      const theme = onScreen(page.getByText('Background', { exact: true })).first()
        .locator('xpath=following::div[.//input[@type="color"] and .//*[text()="Opacity"]][1]');
      await centre(theme);
      await shot(page, '15.4', '05-background-colours', { clip: theme, clipPad: 12 });

      // A background image, with the size and weight the app asks for. Nothing is
      // uploaded here: 15.3 already documents an upload, and a second one would
      // only leave another orphaned file on the fixture.
      const imageBlock = onScreen(page.getByText('No image uploaded', { exact: true })).first()
        .locator('xpath=ancestor::div[.//button][1]');
      // Upload is a <label> over a hidden file input, not a button.
      const upload = onScreen(page.locator('label').filter({ hasText: /^Upload$/ })).first();
      await centre(imageBlock);
      await shot(page, '15.4', '06-background-image', {
        clip: imageBlock, clipPad: 12, annotate: upload,
      });

      // The Slides card. Add Slide is the control; everything under it is one
      // slide per block, in the order the screen will play them.
      const slidesHeading = onScreen(page.getByText('Slides', { exact: true })).first();
      const slidesHeader = slidesHeading.locator('xpath=ancestor::div[.//button][1]');
      const addSlide = page.getByRole('button', { name: 'Add Slide', exact: true });
      await centre(slidesHeader);
      await shot(page, '15.4', '07-slides-card', {
        clip: slidesHeader, clipPad: 12, annotate: addSlide,
      });

      // One slide, whole: its title, how long it stays on screen, whether it
      // plays, and the two components on it.
      const welcome = page.locator('input[value="Welcome"]')
        .locator('xpath=ancestor::div[.//button[normalize-space()="QR code"]][1]');
      await centre(welcome);
      await shot(page, '15.4', '08-one-slide', { clip: welcome, clipPad: 12 });

      // The seven kinds of content a slide can hold. Every slide block carries
      // its own copy of this row, which is what a reader has to understand: you
      // add content to a slide, not to the show.
      const buttonRow = page.getByRole('button', { name: 'Upcoming matches', exact: true }).first()
        .locator('xpath=ancestor::div[.//button[normalize-space()="Ranking"]][1]');
      await centre(buttonRow);
      await shot(page, '15.4', '09-component-buttons', {
        clip: buttonRow, clipPad: 12, annotate: buttonRow, annotatePad: -2,
      });

      // Three of the seven need to be told what to show. Group is one.
      const groupSlide = page.locator('input[value="Group A"]')
        .locator('xpath=ancestor::div[.//*[@role="combobox"]][1]');
      await centre(groupSlide);
      await shot(page, '15.4', '10-group-component', { clip: groupSlide, clipPad: 12 });

      // Sponsors is another, and it counts what it has been given.
      const sponsorSlide = onScreen(page.getByText('2 sponsors selected')).first()
        .locator('xpath=ancestor::div[.//button[normalize-space()="Ranking"]][1]');
      await centre(sponsorSlide);
      await shot(page, '15.4', '11-sponsors-component', { clip: sponsorSlide, clipPad: 12 });

      // --- what happens when a component is not finished --------------------
      // Add a Text component and leave it empty. Save then names it and refuses
      // the whole show, which is the failure a reader will actually hit.
      const firstTextButton = page.getByRole('button', { name: 'Text', exact: true }).first();
      await centre(firstTextButton);
      await firstTextButton.click();
      const save = onScreen(page.getByRole('button', { name: 'Save', exact: true })).first();
      await centre(save);
      await save.click();
      const refusal = page.getByText('Please fix the slideshow fields below before saving.');
      await expect(refusal).toBeVisible({ timeout: 30_000 });
      // Clip the panel that holds the message AND the per-component list. The
      // first attempt walked up two levels and got the whole Slides card, 1800
      // pixels of it, with the message itself below the cut.
      const errors = page.locator('div')
        .filter({ has: refusal })
        .filter({ hasText: /needs text/ })
        .last();
      await expect(errors).toBeVisible();
      await centre(errors);
      await shot(page, '15.4', '12-save-refused', { clip: errors, clipPad: 12 });

      // The fixture must be exactly as it was. Everything above was client-side.
      const after = JSON.stringify((await fx.detail(fx.cup)).presentation?.slideshows ?? []);
      expect(after, '15.4 must not change KB 15 Cup\'s saved slide show').toBe(before);
    });
});
