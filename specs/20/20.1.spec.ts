// 20.1 - Your notifications: reading, marking and deleting.
//
// The article was mapped as "Your notifications - viewing, filtering, marking
// and deleting". **There is no filter.** The modal's own hook only ever sends
// `{limit: 10, skip: n}` - read out of the bundle and confirmed on the wire -
// and the modal carries three controls and no others: Mark all as read in its
// header, and per row a Mark as read tick and a trash button. `GET
// /notifications` does accept `type` and `isRead`, nothing in the app sends
// either, and `isRead` does not even work: every value answers an empty list on
// an account holding eleven unread rows. briefs/20.md has the measurements.
//
// --- Run the seed first. Every time. ---------------------------------------
//
// `node scripts/seed-20.mjs`. Not a convention here - a requirement.
//
// The bell badge and the modal title read `unreadCount` off a Firestore
// document, not off the REST list, and that number is a running tally.
// Shot 05 clicks **Mark all as read**, which sets it to 0, and nothing raises
// it again but a new notification. So this spec spends the badge its own first
// shot needs. fixtures20() asserts the notification set before anything is
// captured and says what to run when it is wrong.
//
// --- The order of these six is not cosmetic -------------------------------
//
//   01  the badge, before anything has been marked
//   02  the modal, every row unread
//   03  one row's two controls, still unread
//   04  the same row after its tick has been used
//   05  the modal after Mark all as read
//   06  the empty state, from a second account
//
// Reversed, 04 and 05 would each destroy the state the shot above them needs.
//
// --- Nothing is deleted ----------------------------------------------------
//
// `DELETE /notifications/:id` is a hard delete with no confirmation, and a
// deleted notification cannot be put back at the timestamp it had.
// docs/style-guide.md, "Actions you can only do once": photograph the control,
// do not use it. Shot 03 outlines the trash button and the spec never presses
// it.
//
// Marking IS reversible in the list - `PATCH /notifications/mark-read {ids,
// isRead: false}` - and restoreUnread20() does that in a `finally`. It does not
// restore the badge; only the seed can.

import { test, expect } from '@playwright/test';
import {
  shot, context20, fixtures20, openNotifications20, closeNotifications20,
  notificationRows20, notificationRow20, markReadButton20, deleteButton20,
  readState20, markAllRead20, loadMoreNotifications20, restoreUnread20,
  scrollNotificationsToTop20,
  identityRow20, bell20, bellBadge20, kb20Notification, asUser,
  KB20, KB20_COUNT, KB20_PAGE_SIZE, KB20_MATCH, KB20_NOTIFICATIONS,
} from '../../lib/kb';

test.describe('20.1 Your notifications', () => {
  test('the badge, the list, marking one, marking all, and the empty state', async ({ browser }) => {
    const fx = await fixtures20();

    // ================= as Pia, who holds eleven ==========================
    //
    // keepBellBadge: the badge is shot 01's subject, and
    // docs/style-guide.md forbids masking the thing the article is about even
    // though the same file masks notification badges everywhere else.
    const pia = await context20(browser, KB20.player, '/', { keepBellBadge: true });
    try {
      const page = pia.page;

      // --- 01: where the bell is, and what the number on it means ----------
      //
      // No clipPad on this one. The identity row is the full width of the
      // sidebar, so padding the clip reaches past it into the page's black hero
      // banner and lays a dark band down the right-hand edge - which is what
      // the first run published.
      await expect(bellBadge20(page)).toHaveText(String(KB20_COUNT));
      await shot(page, '20.1', '01-bell-and-badge', {
        clip: identityRow20(page),
        annotate: bell20(page).first(),
        annotatePad: 6,
      });

      // --- 02: the list, every row unread ----------------------------------
      //
      // openNotifications20() waits out the ten skeleton rows the modal paints
      // while its first fetch is out, then asserts the row count - which fails
      // loudly on an unseeded account rather than photographing somebody
      // else's notifications.
      const dialog = await openNotifications20(page);
      await expect(dialog.getByRole('heading', { name: `Notifications (${KB20_COUNT})` })).toBeVisible();
      await expect(markAllRead20(page)).toBeVisible();
      for (const row of await notificationRows20(page).all()) {
        expect(await readState20(row)).toBe('unread');
      }
      // The three match rows print the fixture's fixed kick-off. Asserted
      // because it is the one absolute date in the capture and a spec running
      // outside Europe/London would render a different sentence.
      await expect(page.getByText(
        `on ${KB20_MATCH.shownDate}, ${KB20_MATCH.shownTime} at`, { exact: false },
      ).first()).toBeVisible();
      await shot(page, '20.1', '02-notifications-open', {
        clip: dialog,
        clipPad: 20,
      });

      // --- 03: one row's two controls --------------------------------------
      //
      // The tick and the trash sit in one flex group, and that group is what
      // the outline goes round: docs/style-guide.md allows two targets in one
      // annotation when the step genuinely has two, and this step does.
      //
      // **The FIRST row**, and that is not arbitrary. Clipping a row further
      // down makes Playwright scroll the list to reach it, and the list then
      // has to be put back before shot 05 - which is a fight with scroll
      // anchoring nobody needs. The top row is already on screen.
      const target = notificationRow20(page, kb20Notification('MatchSummary').shows);
      await expect(target).toBeVisible();
      expect(await readState20(target)).toBe('unread');
      const controls = markReadButton20(target)
        .locator('xpath=ancestor::div[contains(@class,"space-x-3")][1]');
      await expect(controls).toBeVisible();

      // The trash button, asserted and never pressed. It has NO accessible
      // name - no title, no aria-label, no text - which is why it is found as
      // the row's second button, and why the article has to describe it by
      // shape rather than by label. Asserted here so a later build that gives
      // it a name is noticed.
      const bin = deleteButton20(target);
      await expect(bin).toBeVisible();
      await expect(bin).toBeEnabled();
      expect(await bin.getAttribute('title'), 'the trash button has an accessible name now')
        .toBeNull();
      expect(await bin.getAttribute('aria-label')).toBeNull();
      expect((await bin.innerText()).trim(), 'the trash button has text now').toBe('');
      // No clipPad here either, and for the same reason as shot 01: a row is
      // the full width of the modal, so padding the clip reaches past it into
      // the dimmed page behind and lays grey bars down both edges with a
      // fragment of a stat tile in the corner. The first run published that.
      await shot(page, '20.1', '03-row-controls', {
        clip: target,
        annotate: controls,
        annotatePad: 6,
      });

      // --- 04: the same row, marked read -----------------------------------
      //
      // The tick is disabled once the row is read, and the row loses its blue
      // tint. Both are asserted rather than assumed, because the capture is
      // the difference between them and shot 03.
      await markReadButton20(target).click();
      await expect(markReadButton20(target)).toBeDisabled();
      await expect(async () => {
        expect(await readState20(target)).toBe('read');
      }).toPass({ timeout: 10_000 });
      await shot(page, '20.1', '04-row-marked-read', {
        clip: target,
        annotate: markReadButton20(target),
        annotatePad: 6,
      });

      // Prove the second page loads, which is what the article's last step
      // tells the reader. Not a capture - eleven rows in a modal that shows
      // six is a scroll, and a screenshot of a scrolled list says nothing the
      // first one did not. It goes here rather than earlier because it leaves
      // the list scrolled, and shot 05 wants it at the top.
      await loadMoreNotifications20(page);
      await expect(notificationRows20(page)).toHaveCount(KB20_COUNT);
      await expect(
        notificationRow20(page, kb20Notification('FriendAdded').shows),
      ).toBeVisible();

      // Every row reads what lib/fixtures-20.mjs says it reads, in the order
      // the fixture plans - the modal shows them newest first, so the list is
      // walked backwards. This is what makes that table trustworthy rather
      // than decorative, and it caught one row describing the wrong team.
      //
      // Whitespace is collapsed before comparing: a row's text is split across
      // several elements - each team name is its own button - so the rendered
      // string carries line breaks the fixture's single line does not.
      //
      // It also pins the three wording defects the captures carry, so a build
      // that fixes "Liked your comment comment on" fails here and says so.
      const flat = (t: string) => t.replace(/\s+/g, ' ').trim();
      const rendered = (await notificationRows20(page).allInnerTexts()).map(flat);
      const planned = [...KB20_NOTIFICATIONS].reverse();
      for (const [i, want] of planned.entries()) {
        expect(rendered[i], `row ${i + 1} (${want.type}) does not read what the fixture plans`)
          .toContain(flat(want.shows));
      }

      // --- 05: everything read ---------------------------------------------
      //
      // This is the destructive one. Mark all as read sets the Firestore
      // counter to 0, and the header link then renders as an EMPTY button
      // rather than disappearing - `children: unreadCount > 0 ? "Mark all as
      // read" : ""` - so the assertion is on the accessible name being gone,
      // not on the element.
      await markAllRead20(page).click();
      await expect(markAllRead20(page)).toHaveCount(0, { timeout: 15_000 });
      await expect(page.getByRole('dialog').last()
        .getByRole('heading', { name: 'Notifications', exact: true })).toBeVisible();
      for (const row of await notificationRows20(page).all()) {
        expect(await readState20(row)).toBe('read');
      }
      // Put the list back to its top. Loading the second page scrolled it, and
      // two earlier runs published this capture starting on its fourth row:
      // once with the scroll left where it was, and once after a reset that
      // Chrome's scroll anchoring quietly undid as the avatars painted.
      // scrollNotificationsToTop20() waits for the images first, and quiet20()
      // turns anchoring off.
      await scrollNotificationsToTop20(page);
      await shot(page, '20.1', '05-all-marked-read', {
        clip: page.getByRole('dialog').last(),
        clipPad: 20,
      });

      await closeNotifications20(page);
    } finally {
      // Put the list back to unread for the next reader of the fixture. The
      // badge cannot be put back - see the header - so scripts/seed-20.mjs is
      // the real reset either way.
      await restoreUnread20(fx.sessions.player.token);
      await pia.ctx.close();
    }

    // ================= as Emmy, who holds none ===========================
    //
    // A separate context, not a second sign-in on the same page: the app
    // persists a Redux store per origin and the leftover would decide what the
    // modal renders. See context20().
    const emmy = await context20(browser, KB20.empty, '/');
    try {
      const page = emmy.page;
      await bell20(page).first().click();
      const dialog = page.getByRole('dialog').last();
      await expect(dialog).toBeVisible();
      // The empty state, in the app's own words. Asserted before the capture
      // so a slow fetch cannot pass for an empty inbox.
      await expect(dialog.getByRole('heading', { name: 'No notifications' })).toBeVisible({ timeout: 20_000 });
      await expect(dialog.getByText(
        "You're all caught up! Check back later for new updates.", { exact: true },
      )).toBeVisible();
      await expect(notificationRows20(page)).toHaveCount(0);
      // No count in the title and no Mark all as read, because there is nothing
      // to count and nothing to mark.
      await expect(dialog.getByRole('heading', { name: 'Notifications', exact: true })).toBeVisible();
      await shot(page, '20.1', '06-no-notifications', {
        clip: dialog,
        clipPad: 20,
      });
    } finally {
      await emmy.ctx.close();
    }

    // Nothing was deleted. Read the count back off the API rather than off the
    // page, so a row that failed to render is still caught.
    const left = (await asUser(fx.sessions.player.token, '/notifications?limit=50&skip=0'))
      .body?.data ?? [];
    expect(left.length, 'a notification was deleted').toBe(KB20_COUNT);
    expect(KB20_COUNT, 'the set no longer spills onto a second page')
      .toBeGreaterThan(KB20_PAGE_SIZE);
  });
});
