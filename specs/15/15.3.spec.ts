// 15.3 - The presentation editor, info page and gallery.
//
// Title as mapped. An early pass of this brief had it retitled, on the strength
// of the Website sub-tab holding six switches and nothing else. That was wrong:
// the **Info** row carries a 16-pixel pencil whose only accessible name is
// `aria-label="Edit info page"`, and it opens the Description, Pictures and
// Attachments editor in place. So all three things the map names do exist, and
// the pencil is the most findable-by-nobody control in the collection - which is
// what makes the article worth writing.
//
// Fixture: KB 15 Sunday League, whose info page the seed leaves EMPTY. The spec
// unticks a public tab, types a description, adds a picture and adds an
// attachment, then puts every one of them back. Eight other articles photograph
// KB 15 Cup's public page, so none of this happens there.
//
// The reset is belt and braces: the spec restores state itself, and
// `scripts/seed-15.mjs` reconciles the same object, so a run that dies half way
// is repaired by the next seed rather than left for the next spec to trip over.

import { test, expect, type Page } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures15, freezeClock15, centre, onScreen,
  board15Ready, publicContext, openPublicPage, publicTabStrip, resetInfoPage,
} from '../../lib/kb';

const DESCRIPTION = 'Everything you need for the day, in one place.';

/**
 * The switch on one row of the Public tabs card.
 *
 * Found from the row, not from the label text: "Participants", "Chat" and
 * "Leaderboard" all appear in the board's own tab strip and in the sidebar too,
 * so a bare getByText walks up into an ancestor holding all six switches. The
 * rows are the only elements whose whole text is just the label.
 */
function tabSwitch(page: Page, label: string) {
  return page.locator('div[role="button"]')
    .filter({ hasText: new RegExp(`^${label}$`) })
    .locator('button[role="checkbox"]');
}

test.describe('15.3 The presentation editor, info page and gallery', () => {
  test('the six switches, the info page, its pictures and its attachments',
    async ({ page, browser }) => {
      const fx = await fixtures15();
      const sunday = fx.sunday;

      await signInAs(page, fx.email, `/tournaments/${sunday}/presentation`);
      await freezeClock15(page);
      await quiet(page);
      await board15Ready(page, onScreen(page.getByText('Public tabs', { exact: true })).first());

      // The whole editor first: two sub-tabs, six switches, Open website, Save.
      await shot(page, '15.3', '01-presentation-website', {
        mask: [page.getByText('Oona KB', { exact: true })],
      });

      // Six switches, every one on. That is how a tournament arrives.
      const card = onScreen(page.getByText('Public tabs', { exact: true })).first()
        .locator('xpath=ancestor::div[.//button[@role="checkbox"]][1]');
      for (const label of ['Info', 'Participants', 'Standings', 'Leaderboard', 'Matches', 'Chat']) {
        await expect(tabSwitch(page, label)).toHaveAttribute('data-state', 'checked');
      }
      const chat = tabSwitch(page, 'Chat');
      await chat.click();
      await expect(chat).toHaveAttribute('data-state', 'unchecked');
      await shot(page, '15.3', '02-chat-switch-off', {
        clip: card, clipPad: 12, annotate: chat, annotatePad: 8,
      });

      // Nothing has changed for anybody until Save. Worth its own step: the
      // switch moving is not the same as the tab going.
      const save = () => onScreen(page.getByRole('button', { name: 'Save', exact: true })).first();
      await centre(save());
      await shot(page, '15.3', '03-save', {
        mask: [page.getByText('Oona KB', { exact: true })],
        annotate: save(),
      });
      await save().click();
      await expect
        .poll(async () =>
          (await fx.detail(sunday)).presentation?.website?.visiblePublicTabs?.length,
        { timeout: 30_000 })
        .toBe(5);

      const ctx = await publicContext(browser);
      const out = await ctx.newPage();
      try {
        await openPublicPage(out, sunday, 'info');
        const strip = await publicTabStrip(out);
        await expect(strip.getByRole('button', { name: 'Chat', exact: true })).toHaveCount(0);
        await shot(out, '15.3', '04-public-strip-five-tabs', { clip: strip, clipPad: 12 });

        // Put the tab back before anything else. Every later capture belongs to
        // the info page, and leaving the chat tab off would be a change this
        // article made and never undid.
        await chat.click();
        await expect(chat).toHaveAttribute('data-state', 'checked');
        await save().click();
        await expect
          .poll(async () =>
            (await fx.detail(sunday)).presentation?.website?.visiblePublicTabs?.length,
          { timeout: 30_000 })
          .toBe(6);

        // --- the info page --------------------------------------------------
        // The pencil on the Info row. No text, no tooltip, 16 pixels square: the
        // reader will not find it without being told, which is this capture's
        // whole job.
        const pencil = page.getByRole('button', { name: 'Edit info page', exact: true });
        await centre(pencil);
        await shot(page, '15.3', '05-edit-info-page-button', {
          clip: card, clipPad: 12, annotate: pencil, annotatePad: 6,
        });

        await pencil.click();
        const body = page.getByPlaceholder('Welcome your visitors with a custom introduction.');
        await expect(body).toBeVisible({ timeout: 30_000 });
        await expect(page.getByText('Page with tournament information', { exact: true }))
          .toBeVisible();
        await shot(page, '15.3', '06-info-page-editor', {
          mask: [page.getByText('Oona KB', { exact: true })],
        });

        // Description is capped at 200 characters by the field itself.
        await expect(body).toHaveAttribute('maxlength', '200');
        await body.fill(DESCRIPTION);

        // Both file inputs are hidden behind their labels, so the files go
        // straight onto the inputs. The picture input filters to images; the
        // attachment input has no accept filter at all and takes the PDF.
        await page.locator('input[type=file][accept="image/*"]')
          .setInputFiles('assets/15/astro-park.webp');
        await expect(page.getByText('astro-park.webp', { exact: true })).toBeVisible({
          timeout: 30_000,
        });
        await page.locator('input[type=file]:not([accept="image/*"])')
          .setInputFiles('assets/15/kb-15-cup-team-notes.pdf');
        await expect(page.getByText('kb-15-cup-team-notes.pdf', { exact: true })).toBeVisible({
          timeout: 30_000,
        });
        await shot(page, '15.3', '07-description-picture-attachment', {
          mask: [page.getByText('Oona KB', { exact: true })],
        });

        await save().click();
        await expect
          .poll(async () => (await fx.detail(sunday)).presentation?.website?.infoBody,
            { timeout: 30_000 })
          .toBe(DESCRIPTION);

        // What a visitor gets: the description, then Gallery, then Attachments,
        // above the tiles that were there all along.
        await openPublicPage(out, sunday, 'info');
        await expect(out.getByText(DESCRIPTION, { exact: true })).toBeVisible({ timeout: 30_000 });
        await expect(out.getByText('Gallery', { exact: true })).toBeVisible();
        await expect(out.getByText('Attachments', { exact: true })).toBeVisible();
        await shot(out, '15.3', '08-public-info-page');
      } finally {
        await ctx.close();
      }

      // Put the fixture back: empty info page, six public tabs. The seed does the
      // same, but a spec that mutates its fixture restores it itself.
      const put = await resetInfoPage(fx.token, sunday);
      expect(put.ok, 'the info page must be put back empty').toBeTruthy();
    });
});
