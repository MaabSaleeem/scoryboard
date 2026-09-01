// 17.6 - Editing, cancelling and sending reminders.
//
// NOTHING IS CANCELLED and NO REMINDER IS SENT. Cancelling cannot be undone and
// the row stays for ever; the seeded KB 17 Away travel supplies the cancelled
// state instead, and 17.9 photographs it. The Cancel Request window is
// photographed and dismissed. docs/style-guide.md, "Actions you can only do
// once".
//
// Edit is opened and dismissed with Cancel rather than Save, for the same reason:
// a saved title would change what 17.7 and 17.4 photograph.
//
// The clock is frozen for more than the calendar. The app decides overdue in the
// browser as `dueDate <= now`, and an overdue request has Add participants and
// Edit disabled. The fixtures are due 30 September 2026, so without the freeze
// these captures would change behaviour on their own once that date passes.

import { test, expect } from '@playwright/test';
import {
  shot, context17, openRequest, paymentHubReady, fixtures17, KB17, KB17_REQUESTS,
  sidebarIdentity17, topDialog, participantRows,
} from '../../lib/kb';

test.describe('17.6 Editing, cancelling and reminders', () => {
  test('what can be changed after a request has gone out', async ({ browser }) => {
    await fixtures17();
    const mo = await context17(browser, KB17.pro, '/payment');
    try {
      const page = mo.page;
      const subject = KB17_REQUESTS.scratch.title;
      await paymentHubReady(page, subject);

      const details = await openRequest(page, subject);
      await shot(page, '17.6', '01-payment-details', {
        clip: details, clipPad: 8,
        mask: [sidebarIdentity17(page, 'Mo KB')],
      });

      // Edit changes the title and the description. Nothing else: the amount,
      // the due date and the participants are fixed once the request has gone.
      await details.getByRole('button', { name: 'Edit', exact: true }).click();
      const save = details.getByRole('button', { name: 'Save', exact: true });
      await expect(save).toBeVisible();
      await expect(details.getByText('14/40')).toBeVisible();
      await shot(page, '17.6', '02-edit-fields', {
        clip: details, clipPad: 8, annotate: save,
      });
      await details.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(save).toBeHidden();

      const rules = details.getByText('Rules & Actions', { exact: true })
        .locator('xpath=ancestor::div[1]');
      await shot(page, '17.6', '03-rules-and-actions', {
        clip: details, clipPad: 8, annotate: rules,
      });

      // The confirm window, photographed and dismissed.
      const cancelRequest = details.getByRole('button', { name: 'Cancel request', exact: true });
      await cancelRequest.click();
      // topDialog, not a text filter: filter({hasText}) is case-insensitive, so
      // 'Cancel Request' also matches the details window's own 'Cancel request'
      // button and .first() returns the wrong dialog.
      const confirm = topDialog(page);
      await expect(confirm.getByRole('heading', { name: 'Cancel Request' })).toBeVisible();
      await expect(confirm.getByText(/Cancelling keeps this request visible/)).toBeVisible();
      await shot(page, '17.6', '04-cancel-dialog', {
        clip: confirm, clipPad: 8,
        annotate: confirm.getByRole('button', { name: 'Cancel request', exact: true }),
      });
      // Dismiss with the OTHER button. The window has two, and only this one is
      // harmless: "Cancel" closes it, "Cancel request" would go through.
      await confirm.getByRole('button', { name: 'Cancel', exact: true }).click();
      // Assert on the heading, not on topDialog: topDialog is a live locator and
      // still resolves to the details window underneath once the confirm is gone.
      await expect(page.getByRole('heading', { name: 'Cancel Request' })).toBeHidden();

      // Reminders. The section has one for everybody, and each person has their
      // own. Neither is pressed.
      const sectionReminder = details.getByRole('button', { name: 'Send reminder', exact: true })
        .first();
      await shot(page, '17.6', '05-send-reminder-all', {
        clip: details, clipPad: 8, annotate: sectionReminder,
      });

      // The people are below the fold of the dialog's own scroller, so a
      // dialog-wide clip cuts them off - the first run published the top of the
      // window with no rows in it. Clip to the smallest block holding both the
      // heading and the rows, and let locator.screenshot() scroll to it.
      const participants = participantRows(details);
      const piaRow = details.getByText('Pia KB', { exact: true })
        .locator('xpath=ancestor::div[1]');
      await shot(page, '17.6', '06-reminder-per-player', {
        clip: participants, clipPad: 12, annotate: piaRow,
      });
    } finally {
      await mo.ctx.close();
    }
  });
});
