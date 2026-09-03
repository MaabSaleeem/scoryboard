// 20.3 - Why you are not receiving our emails.
//
// Two captures, and they are the only two things a reader can actually check
// inside Scoryboard. Everything else the article says - look in your junk
// folder, the sender is noreply@scoryboard.com, an unverified account is held
// at the verification screen - is prose, because none of it is a control.
//
// **The Email field is disabled.** That is the finding this article is built
// on: the address Scoryboard sends to is the one the account was made with, it
// is shown greyed out on Profile settings, and nothing in the app changes it.
// `input[name="email"]` carries `disabled` and the app paints it
// `bg-gray-100 text-gray-500`. So a reader whose address is wrong cannot fix it
// themselves, and the article says to ask support.
//
// **The second capture is the marketing opt-in**, a Radix checkbox whose
// sentence is the app's own: "Yes! I want early access to new tools, features
// and limited-time deals!" It is the only email switch in the product.
//
// Both captures are of the same column, cropped differently and annotating
// different controls. docs/style-guide.md's "never capture the same element
// twice hoping one comes out" is about hedging; these are two subjects that
// happen to sit next to each other, which is also how 19.2 shot 03 and shot 04
// work.
//
// --- Nothing is changed ----------------------------------------------------
//
// The checkbox is photographed ticked and never clicked. Unticking it would
// need a Save Changes to take, `PUT /users/:userId` is a full REPLACE that
// clears the optional fields it is not sent (config/api.md), and the state
// would then have to be put back. There is nothing to learn from the unticked
// state that the ticked one does not show.

import { test, expect } from '@playwright/test';
import {
  shot, context20, fixtures20, settings20Ready, emailField20, emailGroup20,
  marketingRow20, marketingCheckbox20, sidebarIdentity20, asUser,
  KB20, KB20_MARKETING,
} from '../../lib/kb';

test.describe('20.3 Why you are not receiving our emails', () => {
  test('the address we send to, and the marketing opt-in', async ({ browser }) => {
    const fx = await fixtures20();

    const pia = await context20(browser, KB20.player, '/profile-settings');
    try {
      const page = pia.page;
      await settings20Ready(page);

      // --- 01: the address, greyed out -------------------------------------
      //
      // clipPad 56 rather than a tight crop: it brings in the "Email *" label
      // above the field and the top of the marketing line below, which is what
      // tells a reader they are in the right part of the form. The field itself
      // is 360px wide, and a 360px crop of one input orients nobody.
      await expect(emailField20(page)).toBeDisabled();
      await expect(emailField20(page)).toHaveValue(KB20.player);
      await shot(page, '20.3', '01-email-address-locked', {
        clip: emailGroup20(page),
        clipPad: 56,
        annotate: emailField20(page),
        mask: [sidebarIdentity20(page)],
      });

      // --- 02: the marketing opt-in ----------------------------------------
      //
      // The control is a `button[role="checkbox"]` with `aria-checked`, not an
      // `<input>` - the real input is hidden behind it - so the state is read
      // off the attribute and the outline goes round the whole row, tick and
      // sentence together, because the sentence is what identifies it.
      await expect(marketingCheckbox20(page)).toHaveAttribute('aria-checked', 'true');
      await expect(page.getByText(KB20_MARKETING, { exact: true })).toBeVisible();
      await shot(page, '20.3', '02-marketing-opt-in', {
        clip: marketingRow20(page),
        clipPad: 32,
        annotate: marketingCheckbox20(page),
        annotatePad: 5,
      });

    } finally {
      await pia.ctx.close();
    }

    // Nothing was changed. Read the account back off the API rather than off
    // the page: a checkbox clicked and not saved still looks ticked in the DOM.
    const me = (await asUser(fx.sessions.player.token, '/users/me')).body?.data;
    expect(me?.isMarketingOpted, 'the marketing opt-in was changed').toBe(true);
    expect(me?.email, 'the address was changed').toBe(KB20.player);
  });
});
