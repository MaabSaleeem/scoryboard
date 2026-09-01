// 17.4 - Choosing who to charge, and setting the amount and due date.
//
// NOTHING IS SENT. The last capture of the flow is the completed form with Send
// outlined. A payment request cannot be deleted - DELETE sets it Cancelled and
// the row stays for ever - so a spec that submitted would add a row on every run
// and change what 17.7 photographs. docs/style-guide.md: photograph the dialog,
// do not submit it.
//
// The result the article promises is shown from the seeded fixtures instead: the
// last shot is the request sitting in the REQUESTED table.
//
// The clock is frozen because the due-date picker draws a Today marker.

import { test, expect } from '@playwright/test';
import {
  shot, quiet17, context17, openSourceChooser, chooseSource, formField,
  paymentHubReady, fixtures17, KB17, KB17_TEAMS, KB17_REQUESTS, sidebarIdentity17,
  topDialog, dialogSettled,
} from '../../lib/kb';

test.describe('17.4 Choosing who to charge, and the amount', () => {
  test('selecting players, then the form', async ({ browser }) => {
    await fixtures17();
    const mo = await context17(browser, KB17.pro, '/payment');
    const page = mo.page;
    try {
      await paymentHubReady(page, KB17_REQUESTS.tracked.title);

      await openSourceChooser(page);
      const chooser = topDialog(page);
      await chooseSource(page, 'teams');
      await page.getByText(KB17_TEAMS.united, { exact: true })
        .locator('visible=true').first().click();
      await expect(page.getByRole('heading', { name: 'Select Players' })).toBeVisible();
      await dialogSettled(page, 'Femi KB');

      // Six people on the team, two of them registered. Only registered players
      // can be charged, which is what "(0/5)" and the Add email buttons say.
      await expect(page.getByText('Players (0/5)')).toBeVisible();
      const selectAll = page.getByRole('button', { name: 'Select all', exact: true });
      await shot(page, '17.4', '01-select-players', {
        clip: chooser, clipPad: 8, annotate: selectAll,
      });

      await selectAll.click();
      await expect(page.getByText('Players (2/5)')).toBeVisible();
      await shot(page, '17.4', '02-select-players-all', { clip: chooser, clipPad: 8 });

      const addEmail = page.getByRole('button', { name: 'Add email', exact: true }).first();
      await shot(page, '17.4', '03-add-email', {
        clip: chooser, clipPad: 8, annotate: addEmail,
      });

      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      const form = topDialog(page);
      await expect(form.getByRole('heading', { name: 'Payment Request' })).toBeVisible();
      await shot(page, '17.4', '04-request-form', { clip: form, clipPad: 8 });

      // The picker. Its Today marker is why the clock is frozen.
      const pickDate = page.getByRole('button', { name: 'Select date' });
      await pickDate.click();
      const calendar = page.getByRole('grid');
      await expect(calendar).toBeVisible();
      // NOT clipped to `form`. topDialog is a live locator and the calendar
      // popover is itself a dialog, so `form` re-resolves to the popover the
      // moment it opens - the first run clipped to the calendar alone and lost
      // the month caption. The viewport shot also shows the picker in context,
      // which is what the step is about.
      await shot(page, '17.4', '05-due-date-picker', {
        mask: [sidebarIdentity17(page, 'Mo KB')],
        annotate: calendar,
      });
      await page.getByRole('button', { name: /Wednesday, September 30th, 2026/ }).click();
      // Picking a date renames the control to the date itself, so the old
      // locator stops matching. That disappearance IS the confirmation.
      await expect(page.getByRole('button', { name: 'Select date' })).toHaveCount(0);

      await formField(page, 'Enter title').fill(KB17_REQUESTS.tracked.title);
      await formField(page, 'Enter description').fill(KB17_REQUESTS.tracked.description);
      await formField(page, 'Set base price').fill(String(KB17_REQUESTS.tracked.basePrice));
      const send = page.getByRole('button', { name: 'Send', exact: true });
      await expect(send).toBeEnabled();
      await shot(page, '17.4', '06-form-filled', {
        clip: form, clipPad: 8, annotate: send,
      });
      // STOP. Send is never pressed.

      await page.getByRole('button', { name: 'Close' }).first().click();
      await expect(form).toBeHidden();

      await paymentHubReady(page, KB17_REQUESTS.tracked.title);
      await quiet17(page);
      await shot(page, '17.4', '07-requested-table', {
        mask: [sidebarIdentity17(page, 'Mo KB')],
      });
    } finally {
      await mo.ctx.close();
    }
  });
});
