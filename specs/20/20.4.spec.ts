// 20.4 - Trending, the activity feed on your home page.
//
// The article was mapped as "The activity feed and how to filter it". **There
// is no filter, and the feed is called Trending.**
//
// `GET /activities` takes `referenceType`, `teamId`, `leaderboardId` and
// `tournamentId`. The component that renders the feed takes a `query` prop that
// becomes those parameters - and no caller passes one. Swept across 65 chunks
// pulled from every route in the app's own `Routes` enum, the component is used
// twice and both times as
// `<Trending containerClassName="rounded-lg border bg-white p-3" />`: once in
// the football profile layout, once in the padel one. Same panel, no query, no
// title override. briefs/20.md has the sweep.
//
// So the article is named after the panel, as docs/style-guide.md requires of
// every product noun, and it documents what the panel is and how to move
// through it.
//
// --- Two things about this strip shape the whole spec ---------------------
//
// **It is global.** Every team created and every match finished on staging is
// in it, other collections' fixtures and other people's accounts included, and
// there is no "mine only" parameter. docs/style-guide.md forbids a capture that
// carries another persona's data, so onlyOurActivities20() - installed by
// context20() before the first navigation - filters the real payload down to
// this collection's own rows. Collection 02 solved article 02.1 the same way.
// The prose still tells the reader that Trending is activity from across
// Scoryboard, so the narrowing does not mislead.
//
// **It scrolls itself every 2.5 seconds.** A `setTimeout` in the carousel hook
// calls `scrollTo` on the list, advances its own `activeIndex` and reschedules,
// and it does that under a frozen clock too. Measured: scrollLeft 0, 399, 797,
// 1196 over three intervals. stopTrendingAutoAdvance(), an init script
// context20() installs before the page loads, drops timers asked for at exactly
// that delay - 2500 appears once in the whole bundle - and parkTrending20()
// then asserts that the stub is in the page and that the strip is on its first
// card.
//
// **So every capture here uses a card that is already on screen.** Clipping a
// card off to the right makes Playwright scroll the list to reach it, the
// list's own `onScroll` recomputes `activeIndex` from `scrollLeft`, and the
// Previous arrow lights up - which would make shot 03 a lie about the state a
// reader arrives in. Two and a bit cards fit at 1440px.
//
// --- Read-only -------------------------------------------------------------
//
// Nothing here writes and nothing here is even clicked. The arrows are
// photographed at rest.

import { test, expect } from '@playwright/test';
import {
  shot, context20, fixtures20, trendingReady20, trendingPanel20, trendingCards20,
  trendingCard20, trendingCardMeta20, trendingArrows20, sidebarIdentity20,
  unionBox, clearUnionBox,
  KB20, KB20_TEAMS, KB20_TRENDING, KB20_OURS,
} from '../../lib/kb';

test.describe('20.4 Trending, the activity feed', () => {
  test('the strip, a card, the arrows and the links inside a card', async ({ browser }) => {
    await fixtures20();

    const pia = await context20(browser, KB20.player, '/');
    try {
      const page = pia.page;
      await trendingReady20(page);

      // Every card on screen names one of this collection's own fixtures. That
      // is the narrowing asserted rather than assumed: a filter that silently
      // matched nothing would leave the strip showing the whole platform.
      for (const card of await trendingCards20(page).all()) {
        expect(KB20_OURS.test((await card.innerText()).replace(/\n/g, ' ')),
          'a Trending card carries data this collection did not seed').toBeTruthy();
      }

      // --- 01: the strip in place ------------------------------------------
      //
      // The whole panel: its heading, the cards that fit, and the arrows. The
      // sidebar identity is masked; the relative stamps are not - see
      // NO_CLOCK_FREEZE_20 in lib/kb.ts for why this collection leaves them
      // alone.
      const panel = trendingPanel20(page);
      await expect(panel).toBeVisible();
      await expect(page.getByRole('heading', { name: KB20_TRENDING.title })).toBeVisible();
      await shot(page, '20.4', '01-trending-strip', {
        clip: panel,
        mask: [sidebarIdentity20(page)],
      });

      // --- 02: one card, and what its parts are ----------------------------
      //
      // The meta row - the blue label and the relative time - is the subject
      // here, so the time is NOT masked. That is the one capture in this
      // collection where the stamp is the point rather than noise.
      //
      // The card is found by its sentence, never by position: the strip is
      // ordered by `createdAt` and the seed makes eleven activities in one
      // pass, so which card is third changes with the seed.
      //
      // **It has to be a card that is already on screen**, and that is not
      // tidiness either. Clipping a card that is off to the right makes
      // Playwright scroll the list to reach it, the list's own `onScroll`
      // handler recomputes `activeIndex` from `scrollLeft`, and the Previous
      // arrow lights up - so shot 03 would then show a live Previous arrow on a
      // strip the reader has not touched. Two and a bit cards fit at 1440px, so
      // the first two are safe and the third is not.
      const won = trendingCard20(page, 'just won their game');
      await expect(won).toBeVisible();
      const meta = trendingCardMeta20(won);
      await expect(meta).toBeVisible();
      // "Match", printed uppercase by CSS. The text content is title case.
      await expect(meta.locator('span.uppercase')).toHaveText('Match');
      await shot(page, '20.4', '02-trending-card', {
        clip: won,
        clipPad: 16,
        annotate: meta,
        annotatePad: 5,
      });

      // --- 03: the arrows ---------------------------------------------------
      //
      // Photographed at rest, on the first card: Previous greyed and Next live,
      // which is the state a reader meets. Neither is pressed. An earlier
      // version pressed Next first so both would look live, and that made the
      // capture a state the reader has to create before they can recognise it.
      const arrows = trendingArrows20(page);
      await expect(arrows.prev).toBeDisabled();
      await expect(arrows.next).toBeEnabled();
      // The whole panel again, with the pair outlined - not a close crop of the
      // two buttons. Two earlier versions were worse. Outlining their own row
      // drew a 2300-pixel red box round two 32-pixel buttons, because the row
      // is `justify-center` and full width. Cropping tightly to the pair gave a
      // 112-pixel square with the card above it sliced through the middle of a
      // word. Showing them in the panel is what a reader needs anyway: the
      // arrows mean nothing without the strip they move.
      //
      // unionBox() is what makes one annotation cover both buttons; there is no
      // element in the app that wraps just those two.
      const pair = await unionBox(page, [arrows.prev, arrows.next], 6);
      await shot(page, '20.4', '03-trending-arrows', {
        clip: panel,
        annotate: pair,
        annotatePad: 4,
        mask: [sidebarIdentity20(page)],
      });
      await clearUnionBox(page);

      // --- 04: the links inside a card --------------------------------------
      //
      // A card and the names inside it go to different places: the card opens
      // the match, and each team name opens that team. Both names are real
      // `<button>`s, which is the non-obvious part and the reason this shot
      // exists.
      //
      // The match-summary card, for the same reason shot 02 uses the first one:
      // it is the second card, it is fully on screen, and clipping it scrolls
      // nothing.
      const summary = trendingCard20(page, 'Match summary');
      await expect(summary).toBeVisible();
      const home = summary.getByRole('button', { name: KB20_TEAMS.home });
      const away = summary.getByRole('button', { name: KB20_TEAMS.away });
      await expect(home).toBeVisible();
      await expect(away).toBeVisible();
      // Two targets, one step - docs/style-guide.md allows the second
      // annotation only here. The outline goes round the sentence that holds
      // both names rather than round each name, because two outlines a few
      // pixels apart read as one broken box.
      const sentence = home.locator('xpath=ancestor::div[contains(@class,"line-clamp-2")][1]');
      await expect(sentence).toBeVisible();
      await shot(page, '20.4', '04-trending-card-links', {
        clip: summary,
        clipPad: 16,
        annotate: sentence,
        annotatePad: 5,
      });

      // The strip never moved. parkTrending20() stubbed the list's scrollTo, so
      // an assertion here is what proves the stub held for the whole capture
      // rather than only for the first shot.
      const list = trendingCards20(page).first().locator('xpath=..');
      expect(await list.evaluate((el) => (el as HTMLElement).scrollLeft),
        'the Trending strip advanced itself during the captures').toBe(0);
    } finally {
      await pia.ctx.close();
    }
  });
});
