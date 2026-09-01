// 15.2 - Sharing your tournament link and QR code.
//
// RETITLED. The map says "Sharing your tournament link, QR code and access
// tokens". The link and the QR code are both in one dialog and both work.
// **Access tokens are not reachable.** `/tournaments/token/:token` is a real
// route - it renders "This tournament access link is invalid or expired." for
// anything that is not a token - and nothing in the organiser board produces
// one: the Share Tournament dialog holds the public link and the QR code and
// nothing else. See briefs/15.md, "Unreachable".
//
// The last capture keeps that finding useful rather than dropping it: it is what
// a reader sees if somebody sends them a dead access link, which is the only way
// they will ever meet the screen.
//
// The link and the QR code carry the tournament id, and docs/style-guide.md says
// to mask an id "unless it is the subject". Here it IS the subject, on a staging
// tournament that exists only for these screenshots, so both are shown.

import { test, expect } from '@playwright/test';
import {
  signInAs, quiet, shot, fixtures15, freezeClock15, centre, onScreen,
  board15Ready, openDialog, cancelDialog, publicContext, openPublicPage,
} from '../../lib/kb';

test.describe('15.2 Sharing your tournament link and QR code', () => {
  test('the dialog, the link, the QR code, and a dead access link', async ({ page, browser }) => {
    const fx = await fixtures15();

    await signInAs(page, fx.email, `/tournaments/${fx.cup}/participants`);
    await freezeClock15(page);
    await quiet(page);
    await board15Ready(page, onScreen(page.getByText('List Of All Teams (8)')).first());

    const share = page.getByRole('button', { name: 'Share tournament' });
    await centre(share);
    await share.click();

    const dialog = openDialog(page);
    await expect(dialog.getByText('Share Tournament', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Share public link', { exact: true })).toBeVisible();
    await shot(page, '15.2', '01-share-dialog', { clip: dialog, clipPad: 24 });

    // The link is read-only and the only way to take it is the copy button beside
    // it. That is the step people miss, so it gets the outline.
    const field = dialog.locator('input[readonly]').first();
    await expect(field).toHaveValue(new RegExp(`/tournament/${fx.cup}$`));
    const copy = field.locator('xpath=following::button[1]');
    const linkRow = field.locator('xpath=ancestor::div[.//input][1]');
    await shot(page, '15.2', '02-copy-link', { clip: linkRow, clipPad: 16, annotate: copy });

    // The QR code and the control that prints it. The spec does not press Print:
    // it opens the browser's print dialog, which is OS chrome and cannot be
    // photographed (docs/style-guide.md, "What must not appear").
    const print = dialog.getByRole('button', { name: 'Print QR code' });
    // The QR code is an inline <svg role="img"> with its own label, which is the
    // only stable handle on it: the dialog holds a second svg (the copy icon),
    // and an `xpath=preceding::svg[1]` picks that one, because preceding:: is
    // document order and not nearest-first. The clip is the framed panel around
    // the code, two levels up.
    const qr = dialog.getByRole('img', { name: /Scan the QR code to view/ });
    // Clip the block that holds BOTH the code and the button, found by naming
    // that relationship rather than counting levels. The first attempt clipped
    // the code's own framed panel and cut the annotated button in half.
    const qrBlock = print.locator('xpath=ancestor::div[.//*[@role="img"]][1]');
    await expect(qr).toBeVisible();
    await expect(print).toBeVisible();
    await shot(page, '15.2', '03-qr-code', { clip: qrBlock, clipPad: 20, annotate: print });

    await cancelDialog(page);

    // --- where the link lands ------------------------------------------------
    const ctx = await publicContext(browser);
    const out = await ctx.newPage();
    try {
      await openPublicPage(out, fx.cup, 'info');
      await expect(out.getByRole('button', { name: 'Sign In' })).toBeVisible();

      // The public page carries the SAME Share Tournament dialog, and it works
      // with no session at all - so a spectator can pass the link on without
      // being the organiser, or having an account. That is worth a capture in
      // its own right; the first version of this shot framed the tab strip and
      // duplicated 15.1/03.
      const publicShare = out.getByRole('button', { name: 'Share tournament' });
      await expect(publicShare).toBeVisible();
      await publicShare.click();
      const publicDialog = openDialog(out);
      await expect(publicDialog.getByText('Share Tournament', { exact: true })).toBeVisible();
      await expect(publicDialog.locator('input[readonly]').first())
        .toHaveValue(new RegExp(`/tournament/${fx.cup}$`));
      await shot(out, '15.2', '04-share-from-the-public-page', {
        clip: publicDialog, clipPad: 24,
      });
      await cancelDialog(out);

      // A dead access link. Deliberately not a real token - there is no way to
      // mint one - so this is exactly the screen a reader with a stale link gets.
      await out.goto(`/tournaments/token/${fx.cup}`);
      await expect(out.getByText('This tournament access link is invalid or expired.'))
        .toBeVisible({ timeout: 30_000 });
      await quiet(out);
      await shot(out, '15.2', '05-access-link-expired');
    } finally {
      await ctx.close();
    }
  });
});
