// 02.3 - Getting help and contacting support.
//
// Two links at the foot of the sidebar: FAQ, which is an external page on
// scoryboard.com and opens in a new tab, and Contact Us, which is a form in the
// app.
//
// THIS SPEC DOES NOT SUBMIT THE FORM. `POST /contacts` sends an email to
// Scoryboard's own support address, and a spec that exists to be re-run whenever
// the product changes must not send one every time it runs. The form is filled in
// and left. The route below is a guard, not a stub: if a later edit ever adds a
// click on Submit, the request is aborted and the test fails loudly rather than
// quietly mailing somebody.
//
// The four validation messages the article's "If it does not work" section
// carries were produced during step 1 by selecting Submit on an empty form, which
// is client-side and sends nothing: "Name is required", "Invalid email address",
// "Subject is required", "Message must be at least 10 characters".

import { test, expect } from '@playwright/test';
import {
  shot, quiet, blockPromos, signInAs, fixtures02, KB02,
  sidebar, sidebarHelp, notificationBadge,
} from '../../lib/kb';

test.describe('02.3 Getting help and contacting support', () => {
  test('the help links, the contact form, and the form filled in', async ({ page }) => {
    await fixtures02();

    await blockPromos(page);
    await page.route(
      (url) => url.pathname.endsWith('/contacts'),
      (route) => route.abort(),
    );
    await signInAs(page, KB02.player, '/');
    await quiet(page);

    // 01 - the two links, in their own list under the navigation.
    const help = await sidebarHelp(page);
    // A negative pad. The Contact Us row sits flush against the bottom of the
    // sidebar, so an outline drawn 4px outside it has its lower edge off the
    // capture and only the top line survives - the same trap collection 12 hit
    // on three of 12.4's shots.
    await shot(page, '02.3', '01-help-links', {
      clip: sidebar(page), annotate: help, annotatePad: -3,
      mask: [notificationBadge(page)],
    });

    // 02 - the form, empty. It is not pre-filled from the signed-in account.
    await page.getByRole('link', { name: 'Contact Us' }).click();
    await page.waitForURL('**/contact');
    await quiet(page);
    // Clip to the whole card, not to the <form>. The form element wraps only the
    // right-hand column of inputs, so a clip to it loses "Feature Request" and
    // "Get In Touch" - the two headings that say what the form is for - and cuts
    // the annotation on Submit in half.
    const card = page.getByText('Feature Request', { exact: true })
      .locator('xpath=ancestor::section[1]');
    const form = card.locator('form');
    await expect(form.getByRole('button', { name: 'Submit', exact: true })).toBeVisible();
    await expect(card.getByText('Get In Touch', { exact: true })).toBeVisible();
    await shot(page, '02.3', '02-contact-form', { clip: card });

    // 03 - the same form filled in. Fixed text, no clock and no random value.
    await page.getByPlaceholder('Name', { exact: true }).fill('Pia KB');
    await page.getByPlaceholder('Email', { exact: true }).fill(KB02.player);
    await page.getByPlaceholder('Subject', { exact: true }).fill('My statistics have not updated');
    await page.getByPlaceholder('Message', { exact: true }).fill(
      'I played a match on Thursday and my goals have not appeared on my profile yet.',
    );
    const submit = form.getByRole('button', { name: 'Submit', exact: true });
    await shot(page, '02.3', '03-contact-form-filled', { clip: card, annotate: submit });
  });
});
