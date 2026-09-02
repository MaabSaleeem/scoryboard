// 19.3 - Rating a match, player, team or referee.
//
// Rating happens in exactly one place: the **Rate** button on a Finished match.
// A team page and a player page show the average and open a read-only review
// list; neither has a Rate control, and there is no referee page at all -
// `/referee/:id`, `/referees/:id` and `/referees` are all Page not found. So all
// four subjects are photographed from one dialog on one match.
//
// --- Nothing is submitted --------------------------------------------------
//
// Post is never clicked and Update is never clicked. A rating is not
// irreversible - posting again replaces it and `DELETE /ratings/:id` works over
// the API - but shot 05 exists only because Pia's team rating is exactly 4 with
// exactly that review, and a spec that changed it would break its own next run.
// docs/style-guide.md: photograph the dialog, do not submit it.
//
// --- The one thing that will bite you --------------------------------------
//
// **The star row lights on hover, and the chooser's rows sit roughly where the
// stars appear.** The pointer is therefore left resting on a star the moment a
// panel opens. The first walk through this read three amber stars on an account
// that had never rated the match, which would have published a screenshot of a
// rating nobody chose. openRate() parks the pointer and this spec asserts the
// star count after every open - empty where the fixture left nothing, four on
// the team Pia rated.
//
// --- Shot 07 was added mid-run, and here is why ----------------------------
//
// The brief planned six captures and said a rating could be changed but never
// removed, because the Rate panel offers only Post, Update and Close. That was
// wrong. The read-only **reviews list** - the one behind the "N reviews" button
// - puts a kebab on YOUR OWN review row, and only on yours, carrying **Edit**
// and **Delete**. It has no accessible name and its icon is a plain vertical
// ellipsis, so it reads as noise; it surfaced when an unrelated assertion in
// 19.4 failed and printed the dialog's accessibility tree.
//
// Changing and removing your own rating belongs in THIS article rather than in
// 19.4, which is about how the average is worked out. So 19.3 has seven shots,
// not six, briefs/19.md is amended, and the end-of-run report says so.
//
// The menu is reached from the TEAM page, not from the match: Pia has rated the
// team and has not rated the match, so the team's list is the only one with a
// row of her own in it.
//
// --- Why the Referee row is there at all -----------------------------------
//
// It is `hidden` unless the match carries a referee, and a referee can only be
// put on a match by an account that has SAVED one, which needs a tournament -
// `POST /tournaments/:id/referee` is the only call in the app that sets
// `isReferee`. scripts/seed-19.mjs holds a tournament for that single reason. A
// manager who has never run one sees three rows here, not four; 19.3's prose
// says so.

import { test, expect } from '@playwright/test';
import {
  shot, context19, fixtures19, openRate, starRow, starsLit, headerIdentity19,
  matchStamp19, reviewsButton, reviewMenuButton, settled08,
  asUser, KB19, KB19_AVERAGES, KB19_TEAMS, KB19_NAMES,
} from '../../lib/kb';

test.describe('19.3 Rating a match, player, team or referee', () => {
  test('every subject the Rate dialog offers, photographed before anything is posted', async ({ browser }) => {
    const fx = await fixtures19();

    const pia = await context19(browser, KB19.player, `/match/${fx.matchId}`);
    try {
      const page = pia.page;

      // The Rate control only exists on a Finished match, so the heading is what
      // proves the page is in that state before anything is clicked -
      // config/api.md, "The match page on match day": a live match is headed
      // Match Details and a finished one Match Result.
      //
      // NOT the "MATCH ENDED" card, which is the obvious thing to wait for and
      // does not work. It is upper-cased by CSS and its accessible name is
      // `match ended`, so an exact match on the capitals finds nothing - the same
      // text-transform trap docs/style-guide.md records against GROUP A and
      // DELETE ACCOUNT in collections 14 and 01. It cost this spec one run.
      await expect(page.getByRole('heading', { name: 'Match Result', level: 1 }))
        .toBeVisible({ timeout: 30_000 });
      await expect(page.getByText('match ended', { exact: true })).toBeVisible();
      const rate = page.getByRole('button', { name: 'Rate', exact: true }).first();
      await expect(rate).toBeVisible();

      // --- 01: the button on the finished match -------------------------------
      await expect(page.getByText(KB19_AVERAGES.match.shown, { exact: true }).first()).toBeVisible();
      // A whole-viewport capture, on purpose: the reader's problem is finding
      // the button, and it sits in the top right of a page whose first screen is
      // a hero image and a tab strip. A crop around it would show a pill with no
      // clue where the pill lives.
      //
      // annotatePad -2, not the default 4. The Rate button is flush against the
      // right edge of the viewport, so an outline drawn 4px outside it loses its
      // right-hand side - which is exactly what the first run published.
      await shot(page, '19.3', '01-rate-button', {
        mask: [headerIdentity19(page), ...matchStamp19(page)],
        annotate: rate,
        annotatePad: -2,
      });

      // --- 02: the chooser ------------------------------------------------------
      //
      // Four rows, and the assertion is the article's claim: the Referee row is
      // present because this match has one. On a match with no referee it is not
      // rendered at all.
      await rate.click();
      const chooser = page.getByRole('dialog').last();
      await expect(chooser.getByText('What would you like to rate?')).toBeVisible({ timeout: 15_000 });
      for (const row of ['Match', 'Player', 'Team', 'Referee']) {
        await expect(chooser.getByText(row, { exact: true })).toBeVisible();
      }
      await shot(page, '19.3', '02-rate-chooser', { clip: chooser, clipPad: 8 });
      await page.keyboard.press('Escape');
      await expect(chooser).toBeHidden({ timeout: 15_000 });

      // --- 03: Match. Pia has not rated it, so it opens empty, on Post ---------
      {
        const panel = await openRate(page, 'Match');
        expect(await starsLit(panel), 'Match opened with stars lit').toBe(0);
        await expect(panel.getByRole('button', { name: 'Post', exact: true })).toBeVisible();
        // Both teams and their averages are in this panel's header, which is
        // what makes it the MATCH panel rather than a team one.
        await expect(panel.getByText(KB19_TEAMS.home, { exact: true })).toBeVisible();
        await expect(panel.getByText(KB19_TEAMS.away, { exact: true })).toBeVisible();
        await shot(page, '19.3', '03-rate-match', {
          clip: panel, clipPad: 8, annotate: starRow(panel),
        });
        await page.keyboard.press('Escape');
        await expect(panel).toBeHidden({ timeout: 15_000 });
      }

      // --- 04: Player. A picker, and an empty form -----------------------------
      //
      // The picker defaults to the first player in the line-up, not to Pia - the
      // app disables rating your own player record, so she could not be the
      // default anyway.
      {
        const panel = await openRate(page, 'Player');
        expect(await starsLit(panel), 'Player opened with stars lit').toBe(0);
        await expect(panel.getByRole('button', { name: 'Post', exact: true })).toBeVisible();
        const picker = panel.locator('[aria-haspopup="dialog"]').first();
        await expect(picker).toBeVisible();
        await shot(page, '19.3', '04-rate-player', {
          clip: panel, clipPad: 8, annotate: picker,
        });
        await page.keyboard.press('Escape');
        await expect(panel).toBeHidden({ timeout: 15_000 });
      }

      // --- 05: Team. Pia HAS rated this one, so it opens on Update -------------
      //
      // This is the second of the two states the article documents, and it is
      // the reason lib/fixtures-19.mjs gives Pia a team rating and nothing else.
      {
        const panel = await openRate(page, 'Team');
        expect(await starsLit(panel), 'Team did not open on Pia\'s four stars').toBe(4);
        const update = panel.getByRole('button', { name: 'Update', exact: true });
        await expect(update).toBeVisible();
        await expect(panel.getByText(KB19_AVERAGES.team.shown, { exact: true }).first()).toBeVisible();
        await shot(page, '19.3', '05-rate-team', {
          clip: panel, clipPad: 8, annotate: update,
        });
        await page.keyboard.press('Escape');
        await expect(panel).toBeHidden({ timeout: 15_000 });
      }

      // --- 06: Referee ----------------------------------------------------------
      {
        const panel = await openRate(page, 'Referee');
        expect(await starsLit(panel), 'Referee opened with stars lit').toBe(0);
        await expect(panel.getByRole('button', { name: 'Post', exact: true })).toBeVisible();
        await expect(panel.getByText('Rae KB', { exact: true })).toBeVisible();
        await expect(panel.getByText(KB19_AVERAGES.referee.shown, { exact: true }).first()).toBeVisible();
        await shot(page, '19.3', '06-rate-referee', {
          clip: panel, clipPad: 8, annotate: starRow(panel),
        });
        await page.keyboard.press('Escape');
        await expect(panel).toBeHidden({ timeout: 15_000 });
      }
      // --- 07: changing or removing a rating you have already left -------------
      //
      // Photographed, never chosen from. Delete is not confirmed - the menu item
      // fires `DELETE /ratings/:id` on the click - and it would take Pia's team
      // rating out, which is the fixture shot 05 depends on.
      await page.goto(`/teams/${fx.teamId}`);
      const reviews = reviewsButton(page, `${KB19_AVERAGES.team.totalCount} reviews`);
      await expect(reviews).toBeVisible({ timeout: 30_000 });
      await settled08(page);
      await reviews.click();
      const list = page.getByRole('dialog').last();
      await expect(list.getByRole('button', { name: KB19_NAMES.player })).toBeVisible({ timeout: 15_000 });
      // The clip target has to be a CSS locator, not getByRole('dialog').
      //
      // Opening the menu makes Radix mark the dialog beneath it inert and
      // aria-hidden, and getByRole then matches nothing at all - a live locator
      // taken before the click stops resolving the moment the menu appears, and
      // shot() times out inside centre() with "waiting for
      // getByRole('dialog').last()". An attribute selector ignores the
      // accessibility tree and keeps pointing at the same element.
      const listBox = page.locator('[role="dialog"]').last();
      const kebab = reviewMenuButton(list);
      await expect(kebab).toBeVisible();
      await kebab.click();
      const menu = page.getByRole('menu');
      await expect(menu.getByRole('menuitem', { name: 'Edit', exact: true })).toBeVisible({ timeout: 15_000 });
      await expect(menu.getByRole('menuitem', { name: 'Delete', exact: true })).toBeVisible();
      // Clipped to the DIALOG, not to the menu. The menu is portalled to the
      // body, so the obvious move is to clip to it and pad outwards - collection
      // 18 does exactly that for its message menus. It is wrong here: the menu
      // opens INSIDE the dialog's own box, so padding around it walks the frame
      // off the dialog's right edge instead of onto the review. The first run
      // published a floating Edit/Delete with the reviewer, the stars and the
      // review text all outside the crop.
      await shot(page, '19.3', '07-review-menu', {
        clip: listBox,
        clipPad: 8,
        // The review dates are the day the seed ran and move with it.
        mask: [listBox.getByText(/^\d{2}\s\w{3,4}\s\d{4}$/)],
      });
      await page.keyboard.press('Escape');
      await expect(menu).toBeHidden({ timeout: 15_000 });
    } finally {
      await pia.ctx.close();
    }

    // Nothing was posted, nothing was edited and nothing was deleted: every
    // average is still what the seed asserted. Read off the API, so a rating
    // that landed without changing the page is caught.
    const subjects = {
      match: `match/${fx.matchId}`,
      team: `team/${fx.teamId}`,
      player: `player/${fx.playerId}`,
      referee: `referee/${fx.refereePlayerId}`,
    };
    for (const [name, path] of Object.entries(subjects)) {
      const r = await asUser(fx.sessions.player.token, `/ratings/${path}/summary`);
      expect(r.body?.data?.averageRating, `${name} average moved`).toBe(KB19_AVERAGES[name].averageRating);
      expect(r.body?.data?.totalCount, `${name} count moved`).toBe(KB19_AVERAGES[name].totalCount);
    }
  });
});
