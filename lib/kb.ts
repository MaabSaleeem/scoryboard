// Helpers the collection 12 specs share.
//
// Three jobs: sign a persona in, put the page into a state that captures the
// same way every run, and take the screenshot the brief asked for.
//
// Nothing here reads a clock, invents a name, or waits on a duration. If you are
// tempted to add something that does, it belongs in the spec as a seeded fixture
// instead.

import { expect, type Page, type Locator, type Browser } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// lib/api.mjs is the one implementation of the API client; scripts/ run it under
// plain node, specs bundle it through Playwright's esbuild.
// @ts-ignore - plain JS module, no types
import { admin, asUser, mintSession, signinUrl, upload, API, APP } from './api.mjs';

export { admin, asUser, mintSession, signinUrl, upload, API, APP };

// Collection 12's accounts. `organiser` is unsuffixed because this collection was
// captured before accounts were isolated per collection, and its 80 published
// screenshots come from that account - see account_isolation in
// config/personas.yaml. Every later collection uses personaEmail() below.
export const PERSONAS = {
  organiser: 'kb-organiser@yopmail.com',
  admin: 'kb-12-admin@yopmail.com',
  outsider: 'kb-12-outsider@yopmail.com',
} as const;

/**
 * The account address for a persona role inside one collection.
 *
 * One account per role per collection: a collection seeds only into its own
 * accounts. Sharing an account across collections is what stopped six of
 * collection 12's specs from running - a sibling seeded two tournaments and every
 * spec that had photographed the list went stale.
 *
 * Collection 12 keeps the unsuffixed address it was captured from.
 */
export function personaEmail(role: string, collection: string): string {
  if (collection === '12' && role === 'organiser') return PERSONAS.organiser;
  return `kb-${role}-${collection}@yopmail.com`;
}

export type PersonaKey = keyof typeof PERSONAS;

/**
 * Sign a persona in and land on `path`.
 *
 * The session comes from a freshly minted signin URL, never a pasted token. The
 * URL is single-use per run and expires, which is why it is minted inside the
 * spec rather than stored.
 */
export async function signIn(page: Page, persona: PersonaKey, to = '/tournaments') {
  const url: string = await signinUrl(PERSONAS[persona]);
  await page.goto(url);

  // The app exchanges the token and then routes wherever it likes: the home
  // feed, a "Join a team" interstitial, or a leaderboard prompt, depending on
  // what the account has. Wait for the token to be spent - the /signin path is
  // gone - rather than for any one landing screen.
  await page.waitForURL((u) => !u.pathname.startsWith('/signin'), { timeout: 30_000 });

  // That landing screen can be a bare interstitial with no sidebar, so do not
  // assert anything on it. Go where the spec asked and prove the session there:
  // the sidebar links carry an icon and a label, so match the href rather than
  // an accessible name.
  await page.goto(to);
  await expect(page.locator('a[href="/tournaments"]').first()).toBeVisible();
}

/**
 * Everything that must be off-screen before any capture.
 *
 * The Intercom messenger, the Stripe helper frames and any promo campaign all
 * float over the page and all of them change between runs. Hiding them in the
 * page (rather than masking them) keeps the layout identical.
 */
// The tournament list renders "Your Tournaments (0)" with a row of grey skeleton
// cards before its fetch lands, so the heading alone is not a safe gate for a
// capture.
//
// Do NOT gate on the count. It is global state for the persona: every collection
// that seeds a tournament for this organiser changes it. Six of collection 12's
// specs waited for "Your Tournaments (2)" and stopped running the day the padel
// fixtures took it to four. Wait for cards that are always present instead, which
// proves the fetch landed without caring how many other tournaments exist.
// Takes the titles so a later collection can name its own fixtures rather than
// copy this with different strings baked in.
export async function tournamentListReady(
  page: Page,
  titles: string[] = ['KB Cup', 'KB New Cup'],
) {
  for (const title of titles) {
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  }
}

export async function quiet(page: Page) {
  await page.addStyleTag({
    content: `
      #intercom-container, .intercom-lightweight-app, #intercom-frame,
      iframe[name^="__privateStripe"], #stripeDataLayerFrame,
      [data-testid="promo-campaign"], [role="status"], [aria-live="polite"] {
        display: none !important;
      }
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
    `,
  });
  await expect(page.locator('#intercom-container')).toBeHidden();
}

/**
 * Freeze the wall clock.
 *
 * docs/style-guide.md: "Freeze the clock where the screen shows a date or a
 * countdown ... a calendar's today marker will otherwise differ every run." The
 * Create Tournament modal defaults its start date to today and its date picker
 * greys out everything before today, so any spec that captures either needs this.
 *
 * setFixedTime, not install: it pins Date.now() without replacing the timers
 * Firebase uses to refresh the session, so a frozen clock cannot sign the spec
 * out mid-run. Call it after signIn, never before - the token exchange needs a
 * real clock.
 */
export const FROZEN_NOW = new Date('2026-08-28T09:00:00.000Z');

export async function freezeClock(page: Page) {
  await page.clock.setFixedTime(FROZEN_NOW);
}

/**
 * Scroll `target` to the middle of the viewport.
 *
 * scrollIntoViewIfNeeded only moves an element just far enough to be technically
 * in view, which on these pages leaves it flush against the bottom edge with its
 * annotation outline half cut off. Centring gives the capture room around the
 * subject.
 *
 * Call it before opening a popover, never after: the popovers here are portalled
 * and positioned once, so scrolling the page underneath them leaves them
 * pointing at the wrong place.
 */
export async function centre(target: Locator) {
  await target.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
}

/** Wait for a tournament board tab to be the selected one. */
export async function openBoardTab(page: Page, tab: string) {
  await page.getByRole('button', { name: tab, exact: true }).click();
  await expect(page.getByRole('button', { name: tab, exact: true })).toHaveAttribute(
    'data-state', 'active',
  );
}

/**
 * Draw the one annotation the style guide allows: a 3px #E5202A outline with a
 * 4px radius, no fill, around `target`. Drawn in the page before the capture, so
 * a re-run reproduces it exactly.
 */
export async function annotate(page: Page, target: Locator, pad = 4) {
  const box = await target.boundingBox();
  if (!box) throw new Error('annotate(): target has no bounding box');
  await page.evaluate(
    ({ x, y, width, height, pad: p }) => {
      const el = document.createElement('div');
      el.id = 'kb-annotation';
      Object.assign(el.style, {
        position: 'absolute',
        left: `${x + window.scrollX - p}px`,
        top: `${y + window.scrollY - p}px`,
        width: `${width + p * 2}px`,
        height: `${height + p * 2}px`,
        border: '3px solid #E5202A',
        borderRadius: '4px',
        boxSizing: 'border-box',
        pointerEvents: 'none',
        zIndex: '2147483000',
      });
      document.body.appendChild(el);
    },
    { ...box, pad },
  );
}

export async function clearAnnotation(page: Page) {
  await page.evaluate(() => document.getElementById('kb-annotation')?.remove());
}

export type ShotOptions = {
  /** Clip to this element instead of capturing the whole page. */
  clip?: Locator;
  /** Elements to paint over. Dynamic data only - never the article's subject. */
  mask?: Locator[];
  /** Draw the red outline around this element. */
  annotate?: Locator;
  /**
   * How far outside the annotated element to draw the outline. 4px by default.
   * Use a negative value when the target sits flush against the edge of a
   * clipped capture - a positive pad would put the outline outside the clip and
   * only its inner edge would survive.
   */
  annotatePad?: number;
  /**
   * Capture the whole scrollable page rather than the viewport.
   *
   * docs/style-guide.md allows this only where the article documents a whole
   * page - collection 07's tour of the Edit Team screen is the case it was added
   * for. Call unstickHeader() first: the app's header is `position: sticky`, so
   * without it Playwright stitches the header into the MIDDLE of the image.
   */
  fullPage?: boolean;
  /**
   * Widen a clipped capture by this many CSS pixels on every side.
   *
   * For modals. A clip that hugs a rounded dialog catches a sliver of the dimmed
   * page in each top corner, which reads as a smudge along the top edge wherever
   * the screen behind is dark - collection 04's six gate captures, over the
   * leaderboard and player pages. Framing the dialog with a deliberate margin of
   * that same dimmed page removes the sliver and looks like what the reader sees.
   *
   * Clamped to the viewport, so a dialog near an edge simply gets less margin on
   * that side rather than a clip Playwright refuses.
   */
  clipPad?: number;
};

/**
 * Block until every image on the page has actually painted.
 *
 * Playwright's screenshot does not wait for images, and the tournament header is
 * a remote photo. Capture too early and you get a black banner - which is what
 * made eight of these screenshots differ between two runs of the same spec.
 * Covers both <img> elements and CSS background images.
 */
export async function imagesPainted(page: Page) {
  await page.waitForFunction(() => {
    // Only images that actually occupy space on screen. Several of these pages
    // render a wide-layout and a narrow-layout copy of the same icon and give the
    // unused one a zero-sized box, and one of those - registered.svg on a player
    // profile - reports complete: false for ever while still having a
    // naturalWidth. Waiting on it never finishes and has nothing to do with what
    // the capture shows.
    const imgs = Array.from(document.images).filter((i) => {
      const r = i.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    if (!imgs.every((i) => i.complete && i.naturalWidth > 0)) return false;

    const urls = new Set<string>();
    for (const el of Array.from(document.querySelectorAll('*'))) {
      const bg = getComputedStyle(el).backgroundImage;
      if (!bg || bg === 'none') continue;
      for (const m of bg.matchAll(/url\("?(.*?)"?\)/g)) urls.add(m[1]);
    }
    const w = window as unknown as { __kbBg?: Map<string, boolean>; __kbBgProbes?: HTMLImageElement[] };
    w.__kbBg ??= new Map();
    // The probes are KEPT, and that is the point of this array.
    //
    // A bare `const probe = new Image()` is referenced by nothing once the
    // function returns - only its own handlers point at it - so the browser is
    // free to collect it before the image finishes loading, and then neither
    // `onload` nor `onerror` ever runs and the map entry stays `false` for ever.
    // Collection 10 hit it twice on one screenshot: two background images that both
    // answered 200 when fetched by hand, and a 20-second timeout in here.
    // Intermittent by nature, which is why it survived nine collections.
    w.__kbBgProbes ??= [];
    let ready = true;
    for (const url of urls) {
      if (url.startsWith('data:')) continue;
      if (!w.__kbBg.has(url)) {
        w.__kbBg.set(url, false);
        const probe = new Image();
        probe.onload = () => w.__kbBg!.set(url, true);
        probe.onerror = () => w.__kbBg!.set(url, true);
        probe.src = url;
        w.__kbBgProbes.push(probe);
      }
      if (!w.__kbBg.get(url)) ready = false;
    }
    return ready;
    // `polling: 250` rather than the default `raf`. A page under a frozen clock
    // is not a page that is animating, and a requestAnimationFrame that stops
    // being scheduled takes the whole wait down with it.
  }, undefined, { timeout: 20_000, polling: 250 });
}

/**
 * Take one capture and write it to
 * `screenshots/<collection>/<article>/<nn>-<slug>.png`.
 *
 * Step 2 renames each file to carry its content hash. Step 1 writes the plain
 * name so a diff between runs is readable.
 */
export async function shot(
  page: Page,
  article: string,
  name: string,
  opts: ShotOptions = {},
) {
  const collection = article.split('.')[0];
  const dir = path.join('screenshots', collection, article);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${name}.png`);

  await imagesPainted(page);

  // Refuse to photograph a loading skeleton.
  //
  // docs/style-guide.md forbids "a spinner, skeleton or half-rendered chart", and
  // in collection 15 that fault came back three times from three different
  // causes: a public tab captured on the click rather than on the fetch, a slide
  // show whose heading paints before its fixtures, and a followers dialog whose
  // title comes from a count the page already had. Each one was a missing gate in
  // one spec. This is the mechanical backstop for all of them - every skeleton in
  // this app is an `.animate-pulse`, and a visible one means the capture is early.
  //
  // It throws rather than waiting, on purpose: a wait here would paper over the
  // missing gate and leave the next spec to hit it. The fix belongs in the spec,
  // as a condition that says what the loaded screen looks like.
  const pulsing = await page.locator('.animate-pulse:visible').count();
  if (pulsing) {
    throw new Error(
      `shot(): ${article}/${name} - ${pulsing} loading skeleton(s) on screen. `
      + 'Gate the capture on something only the loaded screen has, rather than on '
      + 'the control that was just clicked.');
  }

  // Clipped captures only: put the page back to the top first.
  //
  // Playwright scrolls a clipped element into view itself, but where it lands
  // depends on where the page was scrolled to when the capture started - and
  // that varies with what the spec did beforehand. A fractional difference in
  // the element's device-pixel alignment re-renders every glyph's antialiasing,
  // which is enough to change the file's content hash and therefore its URL.
  // Measured at 1.5% of pixels on the padel bracket board.
  if (opts.clip) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForFunction(() => window.scrollY === 0);
  }

  const common = {
    path: file,
    animations: 'disabled' as const,
    caret: 'hide' as const,
    mask: opts.mask ?? [],
    maskColor: '#1F2933',
  };
  if (opts.clip && opts.clipPad) {
    // page.screenshot({clip}) takes viewport coordinates and does no scrolling
    // of its own, unlike locator.screenshot(). Bring the target on screen first
    // or a card below the fold is clipped to whatever the viewport happens to
    // be showing - which cost 04.2 the Upgrade to PRO button and the outline
    // around it on the first run with a pad.
    await centre(opts.clip);
    await page.waitForFunction(() => true);
    // The annotation is drawn AFTER that scroll, and the order matters.
    //
    // annotate() converts the target's viewport box to document coordinates with
    // window.scrollY. On a page whose scrolling happens in an inner container
    // rather than on the document - which is most of this app - window.scrollY
    // stays 0, so "document coordinates" are really viewport coordinates, and
    // scrolling afterwards moves the target out from under the outline. Found on
    // 15.9's public-page header, where the outline landed a button's height
    // below the button.
    if (opts.annotate) await annotate(page, opts.annotate, opts.annotatePad);
    const box = await opts.clip.boundingBox();
    if (!box) throw new Error('shot(): clipped target has no bounding box');
    const view = page.viewportSize();
    if (!view) throw new Error('shot(): no viewport');
    const p = opts.clipPad;
    const x = Math.max(0, box.x - p);
    const y = Math.max(0, box.y - p);
    await page.screenshot({
      ...common,
      clip: {
        x, y,
        width: Math.min(view.width - x, box.width + p * 2 - (box.x - p < 0 ? box.x - p : 0)),
        height: Math.min(view.height - y, box.height + p * 2 - (box.y - p < 0 ? box.y - p : 0)),
      },
    });
  } else if (opts.clip) {
    // locator.screenshot() scrolls the element into view itself, so the
    // annotation has to be drawn after that too. scrollIntoViewIfNeeded is what
    // Playwright would do anyway; doing it explicitly means the outline is placed
    // against the position the capture will use.
    await opts.clip.scrollIntoViewIfNeeded();
    if (opts.annotate) await annotate(page, opts.annotate, opts.annotatePad);
    await opts.clip.screenshot(common);
  } else {
    if (opts.annotate) await annotate(page, opts.annotate, opts.annotatePad);
    await page.screenshot({ ...common, fullPage: opts.fullPage ?? false });
  }
  if (opts.annotate) await clearAnnotation(page);
  return file;
}

/**
 * Narrow a locator to the copy that is actually on screen.
 *
 * Several screens render a wide-layout and a narrow-layout copy of the same
 * control and give the unused one a zero-sized box. Both are in the DOM, so a
 * plain match is ambiguous and `.first()` can pick the invisible one.
 */
export function onScreen(l: Locator) {
  return l.locator('visible=true');
}

/** The signed-in user's name and avatar in the header. Masked in most captures. */
export function headerIdentity(page: Page) {
  return page.getByText('Oona KB', { exact: true });
}

/**
 * Look a collection 12 fixture up by name. Specs must never hardcode an id: the
 * seed can legitimately recreate a tournament, and a hardcoded id would then
 * point at a deleted row.
 */
export async function fixtures(persona: PersonaKey = 'organiser') {
  const session = await mintSession(PERSONAS[persona]);
  const token = session.idToken;
  const list = (await asUser(token, '/tournaments')).body.data ?? [];
  const byTitle = (t: string) => {
    const row = list.find((x: any) => x.title === t);
    if (!row) throw new Error(`Fixture tournament "${t}" is missing. Run: node scripts/seed-12.mjs`);
    return row._id ?? row.id;
  };
  return {
    token,
    cup: byTitle('KB Cup'),
    newCup: byTitle('KB New Cup'),
    padelCup: byTitle('KB Padel Cup'),
    newPadelCup: byTitle('KB New Padel Cup'),
    detail: async (id: string) => (await asUser(token, `/tournaments/${id}`)).body.data,
  };
}

// --- collection 13 and later: sign in by address, not by a hardcoded key -----

/**
 * Sign a persona in by email address and land on `path`.
 *
 * `signIn` above takes a key from collection 12's PERSONAS map. Every later
 * collection addresses its own accounts with personaEmail(role, collection), so
 * this variant takes the address itself. Same flow otherwise: a freshly minted
 * signin URL, never a pasted token.
 */
export async function signInAs(page: Page, email: string, to = '/tournaments') {
  const url: string = await signinUrl(email);
  await page.goto(url);
  await page.waitForURL((u) => !u.pathname.startsWith('/signin'), { timeout: 30_000 });
  await page.goto(to);
  await expect(page.locator('a[href="/tournaments"]').first()).toBeVisible();
}

/**
 * Look collection 13's fixtures up by title.
 *
 * Never hardcode an id: `scripts/seed-13.mjs` can legitimately recreate a
 * tournament, and a hardcoded id would then point at a deleted row.
 */
export async function fixtures13() {
  const email = personaEmail('organiser', '13');
  const session = await mintSession(email);
  const token: string = session.idToken;
  const list = (await asUser(token, '/tournaments')).body.data ?? [];
  const byTitle = (t: string) => {
    const row = list.find((x: any) => x.title === t);
    if (!row) throw new Error(`Fixture tournament "${t}" is missing. Run: node scripts/seed-13.mjs`);
    return String(row._id ?? row.id);
  };
  return {
    email,
    token,
    cup: byTitle('KB 13 Cup'),
    summerCup: byTitle('KB 13 Summer Cup'),
    league: byTitle('KB 13 League'),
    sundayLeague: byTitle('KB 13 Sunday League'),
    padelCup: byTitle('KB 13 Padel Cup'),
    padelOpen: byTitle('KB 13 Padel Open'),
    detail: async (id: string) => (await asUser(token, `/tournaments/${id}`)).body.data,
  };
}

/**
 * Wait for the tournament board to have finished loading.
 *
 * The Format and Results tabs render their chrome - header, tab strip - before
 * the fetch lands, so the tab strip alone is not a safe gate for a capture.
 * Wait for something only the loaded board has.
 */
export async function boardReady(page: Page, marker: Locator) {
  await expect(marker).toBeVisible();
  await expect(page.locator('.animate-pulse')).toHaveCount(0);
}

/** The dialog that is actually on screen. Radix leaves closed ones mounted. */
export function openDialog(page: Page) {
  return onScreen(page.locator('[role="dialog"]')).first();
}

/** Close whatever dialog is open, without confirming anything. */
export async function cancelDialog(page: Page) {
  const dlg = openDialog(page);
  const cancel = dlg.getByRole('button', { name: 'Cancel', exact: true });
  if (await cancel.count()) await cancel.first().click();
  else await dlg.getByRole('button', { name: 'Close' }).first().click();
  await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);
}

/**
 * One phase's card on the Format board.
 *
 * The board gives each card `id="phase-card-<phaseId>"`, which is the only
 * stable hook on it - the headings are plain text and the cards are otherwise
 * unlabelled divs. Take the phase id from GET /tournaments/:id, never from the
 * order the cards happen to render in.
 */
export function phaseCard(page: Page, phaseId: string) {
  return page.locator(`#phase-card-${phaseId}`);
}

/**
 * The Phases board on the Format tab: the heading, the "+ Phase" button and
 * every phase card.
 *
 * Clipped rather than captured as a viewport, because the board is taller than
 * 900px on an eight-team tournament and a viewport shot cuts the second group
 * off. There is no id or role on the wrapper, so it is reached from the one
 * element that does have an id - a phase card - and the result is asserted to
 * contain the heading, which fails loudly if the DOM moves.
 */
export async function phasesBoard(page: Page, anyPhaseId: string) {
  const board = phaseCard(page, anyPhaseId).locator('xpath=ancestor::div[4]');
  await expect(board.getByText('Phases', { exact: true })).toBeVisible();
  return board;
}

/**
 * Text on the Format board, narrowed to the copy that is on screen.
 *
 * Every card on this board is rendered twice - a wide layout and a mobile one -
 * and the mobile copy comes first in the DOM with a zero-sized box. A plain
 * getByText is therefore both ambiguous and, with .first(), usually the
 * invisible one.
 */
export function boardText(page: Page, text: string) {
  return onScreen(page.getByText(text, { exact: true })).first();
}

/**
 * The card for one bracket match, by its title.
 *
 * The card is the nearest ancestor carrying Tailwind's `group` marker class -
 * the only stable handle on it, since the card has no id, role or test id. The
 * result is asserted to contain the title, so a DOM change fails here rather
 * than producing a screenshot of the wrong element.
 */
export async function matchCard(page: Page, title: string) {
  const card = boardText(page, title)
    .locator('xpath=ancestor::div[contains(concat(" ", @class, " "), " group ")][1]');
  await expect(card.getByText(title, { exact: true })).toBeVisible();
  return card;
}

/**
 * Scroll `target` to just below the top of the viewport.
 *
 * centre() is right for most captures, but a control that opens a tall popover
 * downwards needs the room below it: the position menu on a bracket slot is
 * nine items and gets cut off when its trigger sits mid-screen. Like centre(),
 * call this before opening the popover, never after.
 */
export async function alignTop(target: Locator) {
  await target.evaluate((el) => {
    el.scrollIntoView({ block: 'start', behavior: 'instant' });
    window.scrollBy(0, -140);
  });
}

/**
 * Wait for the fixtures list under a standings table to have rendered.
 *
 * The Results tab paints its table and the FIXTURES heading before the match
 * cards arrive, so a capture taken as soon as the table is readable catches a
 * half-built list in the bottom third of the frame. That was three screenshots
 * differing between two runs of the collection-13 suite.
 *
 * Gate on a card's own status chip, not on the FIXTURES heading: the heading is
 * there before the list has anything in it.
 */
export async function fixturesReady(page: Page) {
  await expect(
    onScreen(page.getByText('Ended', { exact: true })).first()
      .or(onScreen(page.getByText('Scheduled', { exact: true })).first()),
  ).toBeVisible();
  await expect(page.locator('.animate-pulse')).toHaveCount(0);
}

// --- collection 14: the fixture schedule ------------------------------------

/**
 * Look collection 14's fixtures up by title.
 *
 * Never hardcode an id: `scripts/seed-14.mjs` can legitimately recreate a
 * tournament, and a hardcoded id would then point at a deleted row.
 */
export async function fixtures14() {
  const email = personaEmail('organiser', '14');
  const session = await mintSession(email);
  const token: string = session.idToken;
  const list = (await asUser(token, '/tournaments')).body.data ?? [];
  const byTitle = (t: string) => {
    const row = list.find((x: any) => x.title === t);
    if (!row) throw new Error(`Fixture tournament "${t}" is missing. Run: node scripts/seed-14.mjs`);
    return String(row._id ?? row.id);
  };
  return {
    email,
    token,
    cup: byTitle('KB 14 Cup'),
    league: byTitle('KB 14 League'),
    padelCup: byTitle('KB 14 Padel Cup'),
    padelOpen: byTitle('KB 14 Padel Open'),
    clashCup: byTitle('KB 14 Clash Cup'),
    padelClash: byTitle('KB 14 Padel Clash'),
    detail: async (id: string) => (await asUser(token, `/tournaments/${id}`)).body.data,
  };
}

/**
 * Wait for the Schedule tab to have finished loading.
 *
 * The tab paints its phase tabs, its EXPORT FIXTURES button and each group's
 * header - including SELECT MATCH TO UPDATE - before the fixture cards arrive.
 * A capture taken as soon as the group header is readable therefore catches an
 * empty card. Gate on a fixture's own status chip instead, the same reasoning as
 * `fixturesReady()` on the Results tab.
 *
 * `Incomplete` is included because a knockout fixture, and any fixture with an
 * empty spot, never reads `Scheduled`.
 */
export async function scheduleReady(page: Page) {
  // `.first()` goes on the OUTSIDE of the or: a schedule can hold both chips at
  // once - KB 14 Clash Cup has a Scheduled group and an Incomplete one - and an
  // or of two single locators then resolves to two elements and fails strictly.
  await expect(
    onScreen(page.getByText('Scheduled', { exact: true }))
      .or(onScreen(page.getByText('Incomplete', { exact: true })))
      .first(),
  ).toBeVisible();
  await expect(page.locator('.animate-pulse')).toHaveCount(0);
}

/**
 * One group's or bracket's card on the Schedule tab.
 *
 * Pass the name as the DOM holds it - `Group A`, `Bracket C`. The tab renders it
 * upper case, but that is a CSS text-transform: the accessible name is still the
 * original casing, so `GROUP A` matches nothing.
 *
 * The card has no id, role or test id, and only a group's name is a real
 * heading - a bracket's is a bare span. So the card is reached from the name
 * text and the result is asserted to contain it, which fails loudly here rather
 * than producing a screenshot of the wrong element.
 */
export async function scheduleCard(page: Page, name: string) {
  const label = onScreen(page.getByText(name, { exact: true })).first();
  // A group's card and a bracket's card are different components and round
  // their corners differently - `rounded-[12px]` against `rounded-xl` - so both
  // are accepted rather than writing two nearly identical helpers.
  const card = label.locator(
    'xpath=ancestor::div[contains(@class,"rounded-[12px]") or contains(@class,"rounded-xl")][1]',
  );
  await expect(card.getByText(name, { exact: true }).first()).toBeVisible();
  return card;
}

/**
 * The header strip of a group's or bracket's card: its name, SELECT MATCH TO
 * UPDATE and BULK MATCH UPDATE.
 *
 * Worth having its own locator because the card itself is several screens tall
 * on an eight-team group, and three articles want a shot of just these controls.
 *
 * The buttons render upper case through CSS, so their accessible names are the
 * original casing - "Bulk Match Update", not "BULK MATCH UPDATE".
 */
export async function scheduleCardHeader(page: Page, name: string) {
  const label = onScreen(page.getByText(name, { exact: true })).first();
  const header = label.locator('xpath=ancestor::div[contains(@class,"border-b")][1]');
  await expect(header.getByRole('button', { name: 'Bulk Match Update', exact: true })).toBeVisible();
  return header;
}

/**
 * One fixture's card, found by a team or pair name it shows.
 *
 * Same handle as collection 13's `matchCard`: the nearest ancestor carrying
 * Tailwind's `group` marker class, which is the only stable hook on it.
 */
export async function fixtureCard(page: Page, teamName: string) {
  const card = onScreen(page.getByText(teamName, { exact: true })).first()
    .locator('xpath=ancestor::div[contains(concat(" ", @class, " "), " group ")][1]');
  await expect(card.getByText(teamName, { exact: true })).toBeVisible();
  return card;
}

/**
 * Pick a time in the app's three-column time picker.
 *
 * The picker is hours 01-12, a colon, minutes 00-59 and AM/PM, all rendered as
 * plain divs rather than options - so "09" is ambiguous between the hour column
 * and the minute column and has to be addressed per column. The columns are the
 * children of the picker's own flex row; index 0 is hours, 2 is minutes, 4 is
 * AM/PM (1 is the colon and 3 is a spacer).
 *
 * `trigger` is the button that opens it - "Select time" in the bulk dialog, or a
 * fixture card's own time.
 */
export async function pickTime(
  page: Page, trigger: Locator, hour: string, minute: string, meridiem: 'AM' | 'PM',
) {
  await trigger.click();
  const popper = onScreen(page.locator('[data-radix-popper-content-wrapper]')).first();
  const columns = popper.locator('div.flex.items-start.justify-center > div');
  await expect(columns).toHaveCount(5);
  await columns.nth(0).getByText(hour, { exact: true }).click();
  await columns.nth(2).getByText(minute, { exact: true }).click();
  await popper.getByText(meridiem, { exact: true }).click();
}

/**
 * Pick a date in the app's month calendar.
 *
 * The calendar opens on the current month, which is why any spec that uses it
 * must freeze the clock first - otherwise `monthsForward` lands somewhere else
 * next month. The two non-numeric buttons in the calendar are its previous and
 * next month arrows; neither carries an accessible name.
 */
export async function pickDate(page: Page, trigger: Locator, monthsForward: number, day: string) {
  await trigger.click();
  const popper = onScreen(page.locator('[data-radix-popper-content-wrapper]')).first();
  const nextMonth = popper.locator('button').filter({ hasNotText: /^\d+$/ }).last();
  for (let i = 0; i < monthsForward; i += 1) {
    await nextMonth.click();
  }
  await popper.getByText(day, { exact: true }).click();
}

/**
 * The Bulk Match Updates dialog, opened from one group's or bracket's card.
 *
 * `BULK MATCH UPDATE` and `SELECT MATCH TO UPDATE` open the SAME dialog. The
 * difference is what it is addressed to: the bulk button sends no match ids and
 * updates every fixture in the group, the selection flow sends the ticked ones.
 */
export async function openBulkDialog(page: Page, card: Locator) {
  await card.getByRole('button', { name: 'Bulk Match Update', exact: true }).click();
  const dialog = openDialog(page);
  await expect(dialog.getByText('Bulk Match Updates', { exact: true })).toBeVisible();
  return dialog;
}

/**
 * Untick "Same start time per round", which is what makes Duration and Time
 * between matches editable.
 *
 * They are disabled while the box is ticked - `disabled: isSubmitting ||
 * watch("sameStartTimePerRound")` in the bundle - and the box defaults to
 * ticked. That is the whole subject of 14.3 and the cause 14.6 explains, so the
 * assertions here are deliberately loud: if the default ever changes, every one
 * of those articles is wrong and this fails first.
 */
export async function untickSameStartTime(dialog: Locator) {
  const box = dialog.locator('[role="checkbox"]').first();
  await expect(box).toHaveAttribute('data-state', 'checked');
  await expect(dialog.locator('input[name="timeBetweenMatches"]')).toBeDisabled();
  await box.click();
  await expect(box).toHaveAttribute('data-state', 'unchecked');
  await expect(dialog.locator('input[name="timeBetweenMatches"]')).toBeEnabled();
  return box;
}

// Re-exported so a spec that changes a schedule can put it back with exactly the
// values scripts/seed-14.mjs uses. See lib/fixtures-14.mjs for why they live in
// one place.
// @ts-ignore - plain JS module, no types
export { LEAGUE_SCHEDULE, PADEL_CONFIG, restoreGroupSchedule, regeneratePadelSchedule } from './fixtures-14.mjs';

// --- collection 01: getting started and onboarding --------------------------

// @ts-ignore - plain JS module, no types
import { firebaseSignUp, firebaseSetPassword, deleteAccount } from './api.mjs';
// @ts-ignore - plain JS module, no types
import { ACCOUNTS as KB01, PASSWORD as KB01_PASSWORD, PERSONAL_INFO as KB01_INFO, INVITE as KB01_INVITE } from './fixtures-01.mjs';
// @ts-ignore - plain JS module, no types
import { verificationCode, passwordResetLink, firstLink, emptyInbox } from './mail.mjs';

export { KB01, KB01_PASSWORD, KB01_INFO, KB01_INVITE, firebaseSignUp, firebaseSetPassword, deleteAccount };
export { verificationCode, passwordResetLink, firstLink, emptyInbox };

/**
 * Stop the home page's promotional campaign from reaching the browser.
 *
 * `GET /promo-campaigns/active?screen=Home` returns whatever campaign is
 * running - "Summer competition" today, something else next month - and it
 * renders as a full-width banner that pushes the page down. It is not part of
 * any collection-01 screen, and collection 02.5 is the article about it.
 *
 * Blocked rather than dismissed: the dismiss control writes the dismissal to
 * the account, which would make the first run of a spec differ from the second.
 *
 * Call before the first navigation - a route added after the fetch has gone out
 * does nothing.
 */
export async function blockPromos(page: Page) {
  // A URL predicate, not a glob. `page.route('**/promo-campaigns/active**')`
  // never fired: the request carries a query string - `?screen=Home` - and the
  // glob does not reach past it, so the campaign came through and the banner
  // rendered anyway. Found in collection 02, where the banner is on the page the
  // article is about; collection 01 did not notice because quiet01() also hides
  // anything with "promo" in its class.
  await page.route(
    (url) => url.pathname.includes('/promo-campaigns/'),
    (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'OK', data: null }),
      }),
  );
}

/**
 * Sign in the way the article tells the reader to: the form, with a password.
 *
 * Not signInAs(), which uses a minted token. Two reasons. The password path is
 * what 01.2 documents. And the token path leaves Firebase's `providerData`
 * empty, which makes Profile settings replace Change Password with "You signed
 * in with Unknown" - a screen no reader ever sees.
 */
export async function signInWithPassword(page: Page, email: string, to?: string) {
  if (!KB01_PASSWORD) throw new Error('KB01_PASSWORD missing from .env - see .env.example');
  await page.goto('/signin');
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Password').fill(KB01_PASSWORD as string);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/signin'), { timeout: 40_000 });

  // Prove the session on the home page, then go wherever the spec asked. The
  // wizard screens - Create Leaderboard, Set up your team - render without the
  // sidebar, so the session cannot be proved on them.
  await page.goto('/');
  await expect(page.locator('a[href="/teams"]').first()).toBeVisible();
  if (to && to !== '/') await page.goto(to);
}

/**
 * Everything collection 01 needs off-screen before a capture.
 *
 * quiet() covers the messenger and the animations; this adds the two things
 * that are specific to these screens. The TRENDING feed on the home page is
 * global activity - other people's teams and other collections' tournaments -
 * so no capture may include it (docs/style-guide.md: never another persona's
 * data). It is hidden rather than masked, because a black block the height of
 * the page is not a screenshot anybody can read.
 */
export async function quiet01(page: Page) {
  await quiet(page);
  await page.addStyleTag({
    content: `
      [class*="promo"], #kb-trending-hidden { display: none !important; }
    `,
  });
  const trending = page.getByText('TRENDING', { exact: true });
  if (await trending.count()) {
    await trending.first().evaluate((el) => {
      const panel = el.closest('div');
      if (panel) (panel as HTMLElement).style.visibility = 'hidden';
    });
  }
}

/** The fresh persona's Scoryboard user, with a token, looked up by address. */
export async function fresh01() {
  const session = await mintSession(KB01.fresh);
  const token: string = session.idToken;
  const me = (await asUser(token, '/users/me')).body?.data;
  if (!me?.playerId) {
    throw new Error(`${KB01.fresh} is not seeded. Run: node scripts/seed-01.mjs`);
  }
  return { email: KB01.fresh as string, token, me };
}

/**
 * Put the fresh persona back the way scripts/seed-01.mjs leaves it.
 *
 * 01.5 creates a team and a leaderboard on purpose, and a Free account may hold
 * exactly one leaderboard - so a run that did not clean up would make the next
 * one open "Leaderboard Limit Reached" instead of the create form. Called at the
 * START of that spec as well as the end, because the state a crashed run leaves
 * behind is exactly what has to be cleared.
 *
 * Only touches names beginning "KB 01". The two teams the account was born with
 * are not ours to delete.
 */
export async function restoreFresh01(token: string) {
  const teams = (await asUser(token, '/teams?all=true')).body?.data ?? [];
  for (const t of teams.filter((x: any) => x.name.startsWith('KB 01'))) {
    await asUser(token, `/teams/${t.teamId}`, { method: 'DELETE' });
  }
  const boards = (await asUser(token, '/leaderboards')).body?.data ?? [];
  for (const l of boards) {
    await asUser(token, `/leaderboards/${l.id}`, { method: 'DELETE' });
  }
}

/**
 * Recreate the account 01.7 deletes.
 *
 * POST /admins/users on purpose: 01.7 photographs the delete panel, its confirm
 * dialog and the signed-out screen that follows, and none of those show the
 * profile fields that make an admin-created account differ from a reader's.
 * Rebuilding it the real way would put an inbox read inside a capture spec.
 */
export async function recreateDoomed01() {
  const r = await admin('/admins/users', {
    method: 'POST',
    body: { name: 'Dee', lastName: 'KB', email: KB01.doomed },
  });
  // 409 "User with this email already exists" is the normal answer when the
  // account is still there - which it is at the start of the run, before the
  // spec deletes it. Only a real failure should stop the spec.
  if (!r.ok && r.status !== 409) {
    throw new Error(`Could not rebuild ${KB01.doomed}: ${r.status} ${JSON.stringify(r.body)}`);
  }
  return r;
}

/**
 * Fill the wizard's Personal information step.
 *
 * Every control on it is a Radix combobox with a hidden <select> beside it, so
 * the option has to be picked from the open list rather than set on the select.
 * Sports is a multi-select and stays open after a choice - hence the Escape.
 */
export async function fillPersonalInfo(
  page: Page,
  info: { name: string; lastName: string; gender: string; sports: string[]; position: string },
) {
  await page.locator('input[name="name"]').fill(info.name);
  await page.locator('input[name="lastName"]').fill(info.lastName);
  await pickFromList(page, 'Gender *', info.gender);
  for (const sport of info.sports) await pickFromList(page, 'Sports *', sport);
  await page.keyboard.press('Escape');
  await pickFromList(page, 'Preferred position *', info.position);
}

/** Open the combobox that follows `label` and choose `value` from it. */
export async function pickFromList(page: Page, label: string, value: string) {
  await page.locator('label', { hasText: label }).locator('xpath=following-sibling::button[1]').click();
  await page.getByRole('option', { name: value, exact: true }).click();
}

/**
 * The countdown on the verification screen.
 *
 * It reads "Didn't receive an email? 00:57" and ticks every second, so it is
 * masked in every capture that includes it. Once it reaches zero the digits are
 * replaced by a Resend link, which is stable and is not masked.
 */
export function resendCountdown(page: Page) {
  return page.getByText(/^\d\d:\d\d$/).first();
}

/**
 * The bordered card the signed-out and wizard screens are drawn inside.
 *
 * Personal information and Create Leaderboard are both taller than the 900px
 * viewport, and a full-page capture of either comes out wrong: the app's header
 * is `position: sticky`, so Playwright stitches it into the MIDDLE of the image,
 * on top of the First name field. Clipping to the card avoids the stitch
 * entirely and frames the step rather than the browser.
 *
 * The card is the only element on these screens with a rounded 20px border, and
 * it is asserted to contain the heading so a DOM change fails here rather than
 * producing a screenshot of the wrong box.
 */
export async function authCard(page: Page, heading: string) {
  // Matched on the class attribute rather than as a CSS class: Tailwind's
  // arbitrary-value classes carry brackets, and `div.rounded-\[20px\]` needs
  // escaping that does not survive a JavaScript string. Collection 14 reaches
  // its schedule cards the same way.
  const card = page.locator('div[class*="rounded-[20px]"]').first();
  await expect(card.getByText(heading, { exact: true }).first()).toBeVisible();
  return card;
}

/**
 * Stop the app's header floating over a clipped capture.
 *
 * The header is `position: sticky`, so on any screen taller than the viewport it
 * paints itself over whatever is scrolled underneath - including the top of the
 * card a clipped capture is aimed at. The first run of 01.1 lost the "Step 1"
 * label to it.
 *
 * Sticky elements already occupy their space in normal flow, so switching to
 * static moves nothing. Call it after quiet01(), before a tall capture.
 */
export async function unstickHeader(page: Page) {
  await page.addStyleTag({ content: 'header { position: static !important; }' });
}

/**
 * The profile header at the top of the home page: banner, avatar, name,
 * position and the Followers / Following / Leaderboard / Views counters.
 *
 * Two articles want a picture of "you are signed in", and the home page below
 * this block carries a TRENDING feed of everybody else's activity - other
 * people's teams, other collections' tournaments - which no capture may show.
 * Clipping here is simpler and safer than masking a column.
 *
 * Reached from the Followers counter, because the block itself has no id, role
 * or heading. The result is asserted to hold the counter, so a DOM change fails
 * here rather than producing a screenshot of the wrong box.
 */
export async function profileHeader(page: Page) {
  const counter = onScreen(page.getByText('Followers', { exact: true })).first();
  const header = counter.locator(
    'xpath=ancestor::div[contains(@class,"bg-white") and contains(@class,"border-b")][1]',
  );
  await expect(header.getByText('Followers', { exact: true }).first()).toBeVisible();
  return header;
}

/**
 * "Joined Since August 2026" in the profile header.
 *
 * The account's own join date, so it does not drift between runs - but it does
 * change whenever the seed has to rebuild the persona, and it is not what either
 * capture that includes it is about. docs/style-guide.md: mask absolute dates
 * that are not the point of the screenshot.
 */
export function joinedSince(page: Page) {
  return onScreen(page.getByText(/^Joined Since /)).first();
}

/**
 * The block at the top of the sidebar: your name and address, Edit User Profile
 * with its "Complete your profile (n)" warning, and Sign out.
 *
 * Collapsed until you select your name, which is step 1 of 01.6. Reached from
 * the warning line, because that is the only text in the block that appears
 * nowhere else - "Edit User Profile" is also the page heading of Profile
 * settings, and matching it picks the heading first.
 */
export async function sidebarUserBlock(page: Page) {
  const warning = onScreen(page.getByText(/^Complete your profile \(/)).first();
  await expect(warning).toBeVisible();
  const block = warning.locator('xpath=ancestor::div[contains(@class,"border-y")][1]');
  await expect(block.getByText('Sign out', { exact: true })).toBeVisible();
  return block;
}

/** The "Complete your profile (n)" line itself, for the annotation. */
export function profileChecklistLine(page: Page) {
  return onScreen(page.getByText(/^Complete your profile \(/)).first();
}

/**
 * One labelled row of Profile settings - "Personal Details", "My Bio",
 * "Change Password" - as a clip: the label column on the left and its fields on
 * the right.
 *
 * The page is 2800px tall and nothing on it has an id, so each row is reached
 * from its own heading. The result is asserted to still contain that heading.
 */
export async function settingsRow(page: Page, label: string) {
  // Scoped to `main`. "Leaderboards" and "Teams" are also sidebar links, and a
  // page-wide match finds the link first - whose ancestry has no settings row in
  // it at all. Found in collection 02; collection 01 only ever asked for
  // "Personal Details" and "My Bio", which the sidebar does not carry.
  const heading = onScreen(page.locator('main').getByText(label, { exact: true })).first();
  const row = heading.locator('xpath=ancestor::div[contains(@class,"lg:flex-row")][1]');
  await expect(row.getByText(label, { exact: true }).first()).toBeVisible();
  return row;
}

/**
 * A whole section card on Profile settings, by its upper-case heading.
 *
 * The page is five cards - Profile appearance, Basic information, Leaderboards
 * teams and locations, Security, Delete account - each headed by an `h2` and
 * each holding one or more `settingsRow()`s. Use this where the article is about
 * the section rather than one row.
 *
 * The headings are upper-cased by CSS and inconsistent underneath - "BASIC
 * INFORMATION" and "SECURITY" are upper case in the DOM, "Leaderboards, Teams
 * and Locations" is not - so the match is case-insensitive.
 */
export async function settingsSection(page: Page, heading: string) {
  const h = onScreen(
    page.locator('main h2').filter({ hasText: new RegExp(`^${heading}$`, 'i') }),
  ).first();
  await expect(h).toBeVisible();
  const card = h.locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]');
  await expect(card.locator('h2').first()).toBeVisible();
  return card;
}

/**
 * "Created on 28/08/2026" on a leaderboard card.
 *
 * Today's date, so it differs on every run. Masked wherever it appears - the
 * card's subject is the leaderboard, not the day it was made.
 */
export function createdOn(page: Page) {
  return onScreen(page.getByText(/^Created on /)).first();
}

/**
 * Build an account in the state a reader is in the moment their email is
 * verified: verified, with a password, with Step 1's fields filled in, and with
 * no leaderboard.
 *
 * This is scripts/seed-01.mjs's own recipe, in a form a spec can call. 01.4
 * needs it because the wizard cannot be walked end to end in one pass: Step 1
 * and the code screen are only visible on an account that has never been
 * verified, and Create Leaderboard and Step 3 only open once it has. Nothing
 * returns the six-digit code over the API, and the inbox is not something a
 * capture may depend on - so the spec photographs the first half on a real
 * signup, then rebuilds the same address on the far side of verification and
 * photographs the rest.
 *
 * Deletes whatever is at the address first, so it is safe to call at any point.
 */
export async function rebuildVerified01(
  email: string,
  info: { name: string; lastName: string; gender: string; sports: string[]; position: string },
) {
  await deleteAccount(email, KB01_PASSWORD);

  const made = await admin('/admins/users', {
    method: 'POST', body: { name: info.name, lastName: info.lastName, email },
  });
  if (!made.ok) throw new Error(`POST /admins/users ${email}: ${JSON.stringify(made.body)}`);

  let session = await mintSession(email);
  // A password change revokes every token Firebase has issued, so the session
  // has to be minted again afterwards.
  const set = await firebaseSetPassword(session.idToken, KB01_PASSWORD);
  if (!set.ok) throw new Error(`accounts:update ${email}: ${JSON.stringify(set.body)}`);
  session = await mintSession(email);

  const me = (await asUser(session.idToken, '/users/me')).body?.data;
  await asUser(session.idToken, `/users/${me.id}`, {
    method: 'PUT',
    body: {
      name: info.name,
      lastName: info.lastName,
      gender: info.gender,
      sports: info.sports,
      position: info.position,
      isMarketingOpted: false,
    },
  });

  // POST /admins/users makes "<Name>'s leaderboard". A reader who has just
  // verified their email has none, and Create Leaderboard is the next screen
  // they see - so it has to go.
  for (const board of (await asUser(session.idToken, '/leaderboards')).body?.data ?? []) {
    await asUser(session.idToken, `/leaderboards/${board.id}`, { method: 'DELETE' });
  }
  return { token: session.idToken as string, me };
}

// --- collection 02: finding your way around, and your profile ---------------
//
// Everything below is read by specs/02/*.spec.ts. The names, squads, match and
// expected statistics live in lib/fixtures-02.mjs, which scripts/seed-02.mjs
// also reads - so a spec cannot drift from what the seed produced.

// @ts-ignore - plain JS module, no types
import {
  ACCOUNTS as KB02, PROFILES as KB02_PROFILES, TEAMS as KB02_TEAMS,
  IMAGES as KB02_IMAGES, EXPECTED_PLAYER_STATS as KB02_STATS,
} from './fixtures-02.mjs';

export { KB02, KB02_PROFILES, KB02_TEAMS, KB02_IMAGES, KB02_STATS };

/**
 * The collection's accounts and fixtures, looked up rather than hardcoded.
 *
 * `scripts/seed-02.mjs --rebuild` deletes and recreates all three accounts, and
 * every id changes when it does. A spec that carried an id would then point at
 * a deleted row - collection 12 learned the same lesson about tournaments.
 */
export async function fixtures02() {
  const session = async (email: string) => {
    const token: string = (await mintSession(email)).idToken;
    const me = (await asUser(token, '/users/me')).body?.data;
    if (!me?.playerId) throw new Error(`${email} is not seeded. Run: node scripts/seed-02.mjs`);
    return { email, token, id: String(me.id), playerId: String(me.playerId), membership: me.membership };
  };
  const player = await session(KB02.player);
  const owner = await session(KB02.owner);
  const pro = await session(KB02.pro);

  if (player.membership !== 'Free' || pro.membership !== 'Pro') {
    throw new Error(
      `02.8 needs one Free and one Pro account: ${KB02.player} is ${player.membership}, `
      + `${KB02.pro} is ${pro.membership}. Run: node scripts/seed-02.mjs`,
    );
  }

  const teams = (await asUser(owner.token, '/teams?all=true')).body?.data ?? [];
  const byName = (name: string) => {
    const row = teams.find((t: any) => t.name === name);
    if (!row) throw new Error(`Fixture team "${name}" is missing. Run: node scripts/seed-02.mjs`);
    return String(row.teamId);
  };
  return {
    player, owner, pro,
    home: byName(KB02_TEAMS.home),
    away: byName(KB02_TEAMS.away),
  };
}

/**
 * Wait for the player's statistics to be the numbers the seed produced.
 *
 * They are written asynchronously after a match finishes: the seed read all
 * zeroes a second after posting Finished and the right numbers a minute later,
 * which is the same lag config/personas.yaml warns about for this persona. A
 * capture taken in between shows a profile with no history at all.
 *
 * expect.poll rather than a wait on a duration - docs/style-guide.md.
 */
export async function statsReady(token: string, playerId: string) {
  await expect.poll(async () => {
    const s = (await asUser(token, `/players/${playerId}/stats`)).body?.data ?? {};
    return {
      totalMatches: s.winLossDraws?.totalMatches,
      wins: s.winLossDraws?.wins,
      goalsScored: s.goalsScored,
      playerOfMatch: s.playerOfMatch,
    };
  }, { timeout: 60_000, intervals: [2000] }).toEqual({
    totalMatches: KB02_STATS.totalMatches,
    wins: KB02_STATS.wins,
    goalsScored: KB02_STATS.goalsScored,
    playerOfMatch: KB02_STATS.playerOfMatch,
  });
}

/**
 * Keep the Trending strip to this collection's own fixtures.
 *
 * `GET /activities` is a global feed: every team created and every match
 * finished on staging, other collections' fixtures and other people's accounts
 * included. docs/style-guide.md forbids a capture that carries another persona's
 * data, and the feed drifts between runs besides.
 *
 * This is the real endpoint's real payload with the other entries removed -
 * nothing is invented, and the narrowing lives in the spec so a re-run
 * reproduces it. The relative timestamps still move and are masked instead.
 *
 * Call before the first navigation: a route added after the fetch has gone out
 * does nothing.
 */
export const KB02_OURS = /KB 02|Pia KB|Pru KB|Otto KB|Pia K FC/;

export async function onlyOurActivities(page: Page) {
  // A URL predicate rather than a glob, for the reason in blockPromos() above:
  // /activities always carries ?limit=&page=, and the glob does not match past
  // the query string.
  await page.route((url) => url.pathname.endsWith('/activities'), async (route) => {
    const response = await route.fetch();
    let json: any = null;
    try { json = await response.json(); } catch { json = null; }
    if (!Array.isArray(json?.data)) return route.fulfill({ response });
    return route.fulfill({
      response,
      json: { ...json, data: json.data.filter((a: any) => KB02_OURS.test(String(a?.message ?? ''))) },
    });
  });
}

/**
 * One card on the home page or a player profile, by its heading.
 *
 * Every panel heading is an `h3` inside `main`, and the card is the nearest
 * ancestor that is both rounded and bordered. Matched case-insensitively:
 * "MY BIO", "MATCHES" and "TEAM RANK" are upper case in the DOM, while
 * "Trending" and "Leaderboards" are title case and upper-cased by CSS - the same
 * text-transform trap collections 12 and 14 hit.
 *
 * Scoped to `h3` on purpose. "MATCHES" is also the label on a statistic tile,
 * and a plain text match finds the tile first.
 */
export async function panel(page: Page, heading: string) {
  const h = onScreen(
    page.locator('main h3').filter({ hasText: new RegExp(`^${heading}$`, 'i') }),
  ).first();
  await expect(h).toBeVisible();
  const card = h.locator('xpath=ancestor::div[contains(@class,"rounded-lg")][contains(@class,"border")][1]');
  await expect(card.locator('h3').first()).toBeVisible();
  return card;
}

/**
 * The grid of ten statistic tiles - Matches, Win, Loss, Draw and the rest.
 *
 * Every label is matched case-insensitively. The tiles are upper-cased by CSS
 * and the DOM underneath is inconsistent to the point of comedy: "WIN", "Loss",
 * "DRAW", "W/L Ratio", "goals scored", "ASSISTS", "card". Matching the rendered
 * text finds nothing.
 */
export function statTile(page: Page, label: string) {
  return onScreen(page.getByText(new RegExp(`^${label}$`, 'i'))).first();
}

export async function statTiles(page: Page) {
  const grid = statTile(page, 'goals scored')
    .locator('xpath=ancestor::div[contains(@class,"grid")][1]');
  await expect(grid.getByText(/^assists$/i)).toBeVisible();
  await expect(grid.getByText(/^player of the match$/i)).toBeVisible();
  return grid;
}

/** The sidebar's own navigation list: Home down to Subscriptions. */
export async function sidebarNav(page: Page) {
  const list = page.locator('a[href="/leaderboards"]').first()
    .locator('xpath=ancestor::ul[1]');
  await expect(list.locator('a[href="/"]')).toBeVisible();
  await expect(list.locator('a[href="/subscriptions"]')).toBeVisible();
  return list;
}

/** FAQ and Contact Us, in their own list at the foot of the sidebar. */
export async function sidebarHelp(page: Page) {
  const list = page.locator('a[href="/contact"]').first().locator('xpath=ancestor::ul[1]');
  await expect(list.locator('a[href="https://scoryboard.com/faq/"]')).toBeVisible();
  return list;
}

/** The search box at the top of the sidebar. */
export function searchBox(page: Page) {
  return onScreen(page.getByPlaceholder('Search players, teams & more')).first();
}

/**
 * The list the search box drops down.
 *
 * A portalled popover, so it is NOT inside the search box's own element and no
 * single element holds both - which is why 02.2's captures are viewport shots.
 * Assertions still have to be scoped to it: "KB 02 City" is also on five cards
 * in the Trending strip behind, and a page-wide match is ambiguous.
 */
export function searchResults(page: Page) {
  return onScreen(page.locator('div[class*="bg-popover"]')).first();
}

/** The whole sidebar: logo, search, your name, the navigation, FAQ and Contact Us. */
export function sidebar(page: Page) {
  return page.locator('div[data-sidebar="sidebar 1"]').first();
}

/** The block at the very top of the sidebar: the logo and the search box. */
export async function sidebarHeader(page: Page) {
  const header = page.locator('div[data-sidebar="header"]').first();
  await expect(header.getByPlaceholder('Search players, teams & more')).toBeVisible();
  return header;
}

/**
 * The unread count on the notification bell.
 *
 * docs/style-guide.md masks notification badges: it counts whatever the seed and
 * the other specs happened to generate, so it differs between runs. The badge is
 * the red disc rather than the number - masking only the digits leaves a red ring
 * round a black block.
 */
export function notificationBadge(page: Page) {
  return sidebar(page).locator('div[class*="bg-red-500"][class*="rounded-full"]').first();
}

/**
 * Hide the badge rather than mask it.
 *
 * Masking is the style guide's default and is right wherever the bell is
 * visible. It is wrong where something else covers the bell but not the badge -
 * the open search dropdown does exactly that - because the capture then carries
 * a black square floating beside nothing. Collection 01 made the same call about
 * the TRENDING panel: a block nobody can read is not a screenshot.
 *
 * The badge is hidden, not the bell, so the reader still sees the control.
 */
export async function hideNotificationBadge(page: Page) {
  await notificationBadge(page).evaluate((el) => {
    (el as HTMLElement).style.visibility = 'hidden';
  });
}

/**
 * The number beside the Views label in the profile header.
 *
 * It rises every time any account opens the profile, including the ones these
 * specs sign in as, so it differs between runs. Only the number is masked - the
 * word Views is part of what the capture is showing.
 */
export function viewsCount(page: Page) {
  return onScreen(page.getByText('Views', { exact: true })).first()
    .locator('xpath=preceding-sibling::*[1]');
}

/** Every "2 minutes ago" in the Trending strip. Relative, so always different. */
export function trendingTimes(page: Page) {
  return page.getByText(/^(a|an|\d+)\s+(second|minute|hour|day|month|year)s?\s+ago$/);
}

/**
 * The Profile appearance card on Profile settings: banner, photo, and the
 * upload and delete control beside each.
 *
 * Reached from the banner's own file input, which is the only labelled thing in
 * it - `aria-label="Upload banner image"`, the same pattern collection 12 found
 * on a tournament's settings page. Neither image is something the card can be
 * found by: the banner is a CSS background, and the photo is an `img` that only
 * exists once one has been uploaded.
 */
export async function appearanceCard(page: Page) {
  const card = page.locator('input[aria-label="Upload banner image"]')
    .locator('xpath=ancestor::div[contains(@class,"rounded-lg")][contains(@class,"bg-white")][1]');
  await expect(card.getByText(/^profile appearance$/i)).toBeVisible();
  return card;
}

/** The banner panel inside that card - the 280px-tall strip. */
export function bannerPanel(page: Page) {
  return page.locator('main div[class*="min-h-[280px]"]').first();
}

/**
 * The little edit / delete bar that belongs to one of the two file inputs.
 *
 * Neither control is a button, an anchor or anything carrying a role or a label:
 * each is a bare `div` holding an svg. The only stable handle is the bordered
 * bar the pair sit in, found from the input inside it, and then the hover colour
 * that separates edit (blue) from delete (red).
 */
export function imageControls(page: Page, which: 'banner' | 'avatar') {
  const label = which === 'banner' ? 'Upload banner image' : 'Upload avatar image';
  return page.locator(`input[aria-label="${label}"]`)
    .locator('xpath=ancestor::div[contains(@class,"rounded-md")][1]');
}

export function imageEditControl(page: Page, which: 'banner' | 'avatar') {
  return imageControls(page, which).locator('div[class*="hover:bg-blue-100"]').first();
}

export function imageDeleteControl(page: Page, which: 'banner' | 'avatar') {
  return imageControls(page, which).locator('div[class*="hover:bg-red-100"]').first();
}

/**
 * The image cropper, which is not a dialog.
 *
 * Both croppers - "Edit Your Avatar" for the photo and "Crop Banner" for the
 * banner - are plain overlays with no `role="dialog"`, so openDialog() never
 * finds them. Reached from their heading instead.
 */
export async function cropper(page: Page, heading: string) {
  const h = onScreen(page.getByText(heading, { exact: true })).first();
  await expect(h).toBeVisible();
  const box = h.locator('xpath=ancestor::div[contains(@class,"rounded")][1]');
  await expect(box.getByText(heading, { exact: true }).first()).toBeVisible();
  return box;
}

/**
 * The signed-in account's name in the sidebar. Masked where it is incidental.
 *
 * It sits in its own row under the header block, not inside it, which is also
 * why notificationBadge() is scoped to the whole sidebar rather than the header.
 */
export function sidebarIdentity(page: Page, name: string) {
  return sidebar(page).getByText(name, { exact: true }).first();
}

/**
 * Open the reader's own account block in the sidebar - name, address, Edit User
 * Profile, Sign out. Collapsed until the name is selected.
 *
 * Collection 01's `sidebarUserBlock()` finds it from the "Complete your profile
 * (n)" warning. That warning is only there while a field is missing, and this
 * collection's persona has a complete profile, so the block is found from
 * Sign out instead.
 */
export async function openAccountBlock(page: Page, name: string) {
  await sidebarIdentity(page, name).click();
  const signOut = onScreen(page.getByText('Sign out', { exact: true })).first();
  await expect(signOut).toBeVisible();
  const block = signOut.locator('xpath=ancestor::div[contains(@class,"border-y")][1]');
  await expect(block.getByText('Edit User Profile', { exact: true })).toBeVisible();
  return block;
}

// --- collection 07: Teams ---------------------------------------------------
//
// Everything below is read by specs/07/*.spec.ts. The accounts, teams, squads,
// match and expected statistics live in lib/fixtures-07.mjs, which
// scripts/seed-07.mjs also reads - so a spec cannot drift from the seed.
//
// The one rule that shapes this whole block: **no spec here performs a one-way
// action.** Accepting an invitation, claiming a team, removing a member,
// blocking them and deleting a team are all photographed as the control, and the
// dialog where there is one, and stopped there. Every "after" comes from a
// second fixture the seed already built.

// @ts-ignore - plain JS module, no types
import {
  ACCOUNTS as KB07, PROFILES as KB07_PROFILES, TEAMS as KB07_TEAMS,
  IMAGES as KB07_IMAGES, UNITED_BIO as KB07_BIO,
  EXPECTED_TEAM_STATS as KB07_STATS,
} from './fixtures-07.mjs';

export { KB07, KB07_PROFILES, KB07_TEAMS, KB07_IMAGES, KB07_BIO, KB07_STATS };

/**
 * The collection's accounts and teams, looked up rather than hardcoded.
 *
 * `scripts/seed-07.mjs --rebuild` deletes and recreates every account, and every
 * id changes when it does. A spec carrying an id would then point at a deleted
 * row - collections 12 and 02 both learned this the hard way.
 *
 * KB 07 Orient is found by SEARCH rather than by listing, because an unowned
 * team is in nobody's `/teams?all=true` - not even its creator's. That is not a
 * quirk of this helper; it is the only handle the API gives you, and it is the
 * same way a reader finds one.
 */
export async function fixtures07() {
  const session = async (email: string) => {
    const token: string = (await mintSession(email)).idToken;
    const me = (await asUser(token, '/users/me')).body?.data;
    if (!me?.playerId) throw new Error(`${email} is not seeded. Run: node scripts/seed-07.mjs`);
    return { email, token, id: String(me.id), playerId: String(me.playerId), membership: me.membership };
  };

  const pro = await session(KB07.pro);
  const heir = await session(KB07.heir);
  const free = await session(KB07.free);

  const listed = async (who: { token: string }) =>
    (await asUser(who.token, '/teams?all=true')).body?.data ?? [];
  const byName = (rows: any[], name: string) => {
    const row = rows.find((t: any) => t.name === name);
    if (!row) throw new Error(`Team "${name}" is missing. Run: node scripts/seed-07.mjs`);
    return String(row.teamId);
  };

  const proTeams = await listed(pro);
  const heirTeams = await listed(heir);
  const freeTeams = await listed(free);

  const hits = (await asUser(pro.token, `/teams?name=${encodeURIComponent(KB07_TEAMS.orient)}`))
    .body?.data ?? [];
  const orient = hits.find((t: any) => t.name === KB07_TEAMS.orient);
  if (!orient) {
    throw new Error(`"${KB07_TEAMS.orient}" is not findable by search. Run: node scripts/seed-07.mjs`);
  }

  return {
    pro,
    heir,
    free,
    teams: {
      united: byName(proTeams, KB07_TEAMS.united),
      rovers: byName(proTeams, KB07_TEAMS.rovers),
      athletic: byName(proTeams, KB07_TEAMS.athletic),
      reserves: byName(proTeams, KB07_TEAMS.reserves),
      albion: byName(proTeams, KB07_TEAMS.albion),
      wanderers: byName(heirTeams, KB07_TEAMS.wanderers),
      casuals: byName(freeTeams, KB07_TEAMS.casuals),
      orient: String(orient.id),
    },
  };
}

/**
 * Sign in and land on a screen that has NO sidebar.
 *
 * `signInAs()` proves the session by waiting for the sidebar's /tournaments
 * link. That is right for every screen inside the app and wrong for the three
 * interstitials - `/team/join` is one, and collection 01's wizard steps are the
 * others - which render a bare card on a plain header.
 *
 * So this signs in through the app first, on a screen that does have a sidebar,
 * and only then navigates. Same minted-URL flow, same single-use token.
 */
export async function signInBare(page: Page, email: string, to: string) {
  await signInAs(page, email, '/teams');
  await page.goto(to);
}

/**
 * Everything collection 07 needs off-screen before a capture.
 *
 * quiet() covers the messenger and the animations. This adds the promotional
 * banner, which sits on the home page and on the team pages and is a different
 * campaign every month.
 *
 * NOT hidden: toasts and `[role="status"]`. quiet() hides those, and 07.7's
 * whole subject is the modal a Free owner gets when they try to add an
 * Administrator. Any spec that needs a refusal on screen must call quiet() and
 * then check the refusal is still there - the Team Limit Reached modal is a real
 * dialog, not a toast, so it survives.
 */
export async function quiet07(page: Page) {
  await quiet(page);
  await page.addStyleTag({
    content: '[data-testid="promo-campaign"], #promo-campaign { display: none !important; }',
  });
}

/**
 * Hide the signed-in name in the sidebar rather than mask it.
 *
 * Masking is the style guide's default and is right wherever the name is
 * visible. It is wrong where something else covers the sidebar but not the mask
 * - the open search dropdown does exactly that - because Playwright paints the
 * block at the element's own coordinates, which are now UNDERNEATH the dropdown,
 * and the capture comes back with a black bar across the search results.
 *
 * Collection 02 made the same call about the notification badge, for the same
 * reason and on the same screen.
 */
export async function hideSidebarIdentity(page: Page, name: string) {
  await sidebarIdentity(page, name).evaluate((el: HTMLElement) => {
    el.style.visibility = 'hidden';
  });
}

/**
 * Wait for Manage Teams to have finished loading.
 *
 * The screen paints its heading, its Add Team button and the column headers
 * before the fetch lands, so none of those is a safe gate. Wait for a named team
 * the seed always builds.
 *
 * Do NOT gate on a count of rows. That is global state for the account: 07.1
 * creates a team and 07.11 photographs a delete dialog, and a count would make
 * the specs order-dependent. Collection 12 lost six specs to exactly that.
 */
export async function teamListReady(page: Page, names: string[] = [KB07_TEAMS.united]) {
  for (const name of names) {
    await expect(teamRow(page, name)).toBeVisible();
  }
  // And wait for the one crest in the list to arrive.
  //
  // Every row paints the team's initials on a coloured disc first and swaps in
  // the crest when the image loads. imagesPainted() cannot help: it only knows
  // about <img> elements that are already in the DOM, and this one is not there
  // yet. Without this gate the Manage Teams captures come back showing "KU"
  // where KB 07 United's badge should be - which they did, on the first full run
  // of this collection, in five separate shots.
  await expect(teamRow(page, KB07_TEAMS.united).locator('img')).toBeVisible();
}

/**
 * One row on Manage Teams.
 *
 * The rows are a CSS grid with no id, role or test id, and the name is a bare
 * `span` inside a clipped box - so the row is reached from the name and asserted
 * to contain it, which fails loudly here rather than producing a screenshot of
 * the wrong row.
 */
export function teamRow(page: Page, name: string) {
  return onScreen(page.locator('div[class*="grid-cols-["]').filter({
    has: page.locator(`span:text-is("${name}")`),
  })).first();
}

/** The three-dot menu at the end of a Manage Teams row: Edit and Remove. */
export function teamRowMenu(page: Page, name: string) {
  return teamRow(page, name).locator('[aria-haspopup="menu"]');
}

/**
 * One member's row on the Edit Team page.
 *
 * Two things to know. The row is `div.grid-cols-5`, and every row is rendered
 * TWICE - a wide layout inside `.hidden.lg\\:block` and a narrow one - so the
 * match has to be narrowed to the copy on screen or it resolves to two elements
 * and fails strictly.
 *
 * Members with an account are matched by address, which is unique. Name-only
 * rows have no address and are matched by name.
 */
export function memberRow(page: Page, who: string) {
  return onScreen(page.locator('div[class*="grid-cols-5"]').filter({ hasText: who })).first();
}

/** The three-dot menu on a member's row: Edit, Remove from team, Remove & Block. */
export function memberRowMenu(page: Page, who: string) {
  return memberRow(page, who).getByRole('button').last();
}

/**
 * A section card on the Edit Team page, by its heading.
 *
 * The page is five cards - PROFILE APPEARANCE, TEAM INFORMATION, TEAM PLAYERS,
 * LEADERBOARDS, DELETE TEAM - and none of them carries an id. Each is reached
 * from its own heading and asserted to still contain it.
 *
 * The headings are upper case on screen; match them case-insensitively, because
 * whether the capitals are in the DOM or in the CSS varies from card to card -
 * the same trap collections 12, 14 and 01 all hit.
 *
 * Scoped to `main`, and that is not optional: the sidebar's navigation carries a
 * "Leaderboards" link, so a page-wide match for the LEADERBOARDS card finds the
 * nav item first and clips a 510px-wide strip of the sidebar instead of the card.
 */
export async function teamCard(page: Page, heading: string) {
  const h = onScreen(page.locator('main').getByText(new RegExp(`^${heading}$`, 'i'))).first();
  await expect(h).toBeVisible();
  const card = h.locator('xpath=ancestor::div[contains(@class,"bg-white")][1]');
  await expect(card.getByText(new RegExp(`^${heading}$`, 'i')).first()).toBeVisible();
  return card;
}

/**
 * A tab on the team page.
 *
 * The labels render upper case through CSS, so the accessible name is the
 * original casing: "Player Stats", not "PLAYER STATS". Matching what is on
 * screen finds nothing. Each tab is also a route, so the click navigates.
 */
export async function teamTab(page: Page, name: string) {
  const tab = page.getByRole('button', { name, exact: true });
  await expect(tab).toBeVisible();
  await tab.click();
  return tab;
}

/**
 * A Radix Select on these screens - team size, member role, the friend list.
 *
 * Two things, both learned the hard way in this collection.
 *
 * A plain click DOES open them here; the dispatched-click workaround collections
 * 12, 13 and 14 needed for the venue button and the padel player count is not
 * required. What is required is not pressing Escape afterwards: Escape closes
 * the whole modal, not just the list.
 *
 * And the options are matched by TEXT inside the open listbox rather than by
 * `getByRole('option', {name})`. The accessible name carries the selected-item
 * indicator, so an exact role match on "7 VS 7" finds nothing.
 */
export async function openSelect(page: Page, trigger: Locator) {
  await trigger.click();
  const list = page.locator('[role="listbox"]');
  await expect(list).toBeVisible();
  return list;
}

export async function pickOption(page: Page, trigger: Locator, value: string) {
  const list = await openSelect(page, trigger);
  await list.getByText(value, { exact: true }).first().click();
  await expect(trigger).toContainText(value);
}

/**
 * The team's own share code, and one member's invitation id.
 *
 * Both appear in a capture, and docs/style-guide.md says to mask a share code
 * unless it is the subject. In 07.5 it IS the subject - the article is about the
 * link you send somebody - so it is shown, on a staging team that exists only for
 * these screenshots. Everywhere else, mask it with this locator.
 */
export function invitationLinkField(page: Page) {
  return page.locator('[role="dialog"] input[readonly], [role="dialog"] input[value*="shareCode"], [role="dialog"] input[value*="inviteCode"]').first();
}

/**
 * Wait for the team page to have finished loading.
 *
 * The header, the tab strip and the Grow Your Team banner all paint before the
 * fetches land, so none is a safe gate. Wait for the member count, which only
 * appears once the team has been read.
 */
export async function teamPageReady(page: Page, teamName: string) {
  await expect(onScreen(page.getByText(teamName, { exact: true })).first()).toBeVisible();
  await expect(onScreen(page.getByText('Members', { exact: true })).first()).toBeVisible();
}

/**
 * "Joined Since August 2026" on a team page, and the Views counter beside it.
 *
 * The join date is the team's own and does not drift between runs - but it does
 * change whenever the seed rebuilds, and it is not what any capture here is
 * about. Views rises every time any account opens the page, including these
 * specs. docs/style-guide.md: mask both.
 */
export function teamJoinedSince(page: Page) {
  return onScreen(page.getByText(/^Joined Since/)).first();
}

export function teamViews(page: Page) {
  return onScreen(page.getByText('Views', { exact: true })).first()
    .locator('xpath=preceding-sibling::*[1]');
}

// --- collection 04: Plans & membership --------------------------------------
//
// Three accounts, and the reason there are three is worth stating once.
//
// docs/style-guide.md, "Actions you can only do once": a free_pro article gets
// two seeded accounts, one Free and one Pro, never one account flipped between
// captures - a flipped account only works if the specs run in one order, and a
// crash halfway leaves it in the wrong state for every other spec.
// config/personas.yaml still says collections 04 and 18 flip one account; that
// note predates the rule and this collection follows the rule. See briefs/04.md.
//
// So: `free` (Marc) is Free and stays Free, `pro` (Nia) is Pro and stays Pro,
// and `upgrade` (Ubi) is the throwaway 04.2 actually upgrades. There is no
// confirm step on the way to Pro - selecting "Upgrade to PRO" upgrades you on
// the spot - so that one capture cannot be a photograph of an unsubmitted
// dialog. The spec performs it and puts the account back with the admin API,
// which is the reset the style guide asks the seed to provide.

// @ts-ignore - plain JS module, no types
import * as KB04 from './fixtures-04.mjs';

export { KB04 };

/**
 * Collection 04's accounts, their tokens and the ids a spec needs.
 *
 * Never hardcode an id: `scripts/seed-04.mjs` can legitimately rebuild an
 * account and every id changes. Look things up here instead.
 */
export async function fixtures04() {
  const read = async (key: 'free' | 'pro' | 'upgrade' | 'organiser' | 'grant') => {
    const email: string = KB04.ACCOUNTS[key];
    const session = await mintSession(email);
    const me = (await asUser(session.idToken, '/users/me')).body?.data;
    if (!me) throw new Error(`${email} has no Scoryboard user. Run: node scripts/seed-04.mjs`);
    return { email, token: session.idToken as string, ...me };
  };

  const free = await read('free');
  const pro = await read('pro');
  const upgrade = await read('upgrade');
  const organiser = await read('organiser');
  const grant = await read('grant');

  if (free.membership !== 'Free') {
    throw new Error(`${free.email} is ${free.membership}, not Free. Run: node scripts/seed-04.mjs`);
  }
  if (pro.membership !== 'Pro') {
    throw new Error(`${pro.email} is ${pro.membership}, not Pro. Run: node scripts/seed-04.mjs`);
  }

  const boardOf = async (who: { token: string; email: string }) => {
    const list = (await asUser(who.token, '/leaderboards')).body?.data ?? [];
    if (!list.length) throw new Error(`${who.email} owns no leaderboard. Run: node scripts/seed-04.mjs`);
    const b = list[0];
    return { id: String(b._id ?? b.id), name: String(b.name) };
  };

  const teams = (await asUser(free.token, '/teams')).body?.data ?? [];
  const team = teams.find((t: any) => t.name === KB04.TEAM);
  if (!team) throw new Error(`${KB04.TEAM} is missing. Run: node scripts/seed-04.mjs`);

  // The friends list has to sit exactly ON the limit, or 04.3's first capture
  // is a success rather than the refusal the article is about. Asserted here,
  // over the API, rather than by counting rows on the page: every row renders
  // two "Add To Team" buttons, so a DOM count reads 28 for 14 friends.
  //
  // Watch out for the other half of this. GET /friends EXCLUDES a friend who
  // has joined one of your teams, and the limit is measured against that same
  // filtered list - so a friend left on a team quietly takes the count under 14.
  const friends = (await asUser(free.token, '/friends')).body?.data ?? [];
  if (friends.length !== KB04.FRIEND_LIMIT) {
    throw new Error(
      `${free.email} has ${friends.length} friends, not ${KB04.FRIEND_LIMIT}. ` +
      `04.3 needs the list on the limit. Run: node scripts/seed-04.mjs`,
    );
  }

  // --- Tournament Pro -------------------------------------------------------
  //
  // The organiser must have NO free Tournament Pro slots or the tab shows the
  // allowance panel instead of the paywall, and the grant account must have
  // exactly the number 04.6 photographs. The grant has no revoke, so a wrong
  // value here is not something a spec can fix - fail and say so.
  if ((organiser.freeTournamentProAllowanceRemaining ?? 0) !== 0) {
    throw new Error(
      `${organiser.email} has free Tournament Pro slots. 04.4 and 04.5 need the paywall.`,
    );
  }
  if ((grant.freeTournamentProAllowanceRemaining ?? 0) !== KB04.FREE_PRO_SLOTS) {
    throw new Error(
      `${grant.email} has ${grant.freeTournamentProAllowanceRemaining} free Tournament Pro ` +
      `slots, not ${KB04.FREE_PRO_SLOTS}. Run: node scripts/seed-04.mjs`,
    );
  }

  const tournaments = (await asUser(organiser.token, '/tournaments')).body?.data ?? [];
  const cup = tournaments.find((t: any) => t.title === KB04.TOURNAMENT);
  if (!cup) throw new Error(`${KB04.TOURNAMENT} is missing. Run: node scripts/seed-04.mjs`);
  if (cup.pricingPlan !== 'Basic') {
    throw new Error(
      `${KB04.TOURNAMENT} is on the ${cup.pricingPlan} plan. 04.5's selector lists only Basic ones.`,
    );
  }

  return {
    free, pro, upgrade, organiser, grant,
    team: { id: String(team.teamId ?? team.id), name: KB04.TEAM as string },
    freeBoard: await boardOf(free),
    proBoard: await boardOf(pro),
    tournament: { id: String(cup._id ?? cup.id), name: KB04.TOURNAMENT as string },
  };
}

/**
 * Open the Tournament Pro tab on /subscriptions and wait for its cards.
 *
 * A different product from the membership above: per tournament, real money,
 * bought through Stripe. No spec in this collection buys one.
 */
export async function tournamentTabReady(page: Page) {
  await page.getByRole('tab', { name: KB04.TOURNAMENT_TAB }).click();
  await expect(page.getByRole('tab', { name: KB04.TOURNAMENT_TAB }))
    .toHaveAttribute('data-state', 'active');
  await expect(onScreen(page.getByText(KB04.TOURNAMENT_HEADING, { exact: true })).first())
    .toBeVisible();
  for (const marker of ['Up to 5 teams', 'List all your sponsors', 'Unlimited tournaments']) {
    await expect(onScreen(page.getByText(marker, { exact: true })).first()).toBeVisible();
  }
}

/**
 * One of the three tournament plan cards.
 *
 * Picked by a feature line unique to that card, for the same reason planCard()
 * is: the titles repeat elsewhere on the screen and Playwright's string
 * `hasText` is case-insensitive, so "BASIC" also matches "Everything in Basic".
 */
export function tournamentPlanCard(page: Page, plan: 'basic' | 'pro' | 'annual') {
  const marker = {
    basic: 'Up to 5 teams',
    pro: 'List all your sponsors',
    annual: 'Unlimited tournaments',
  }[plan];
  return page.locator('div[class*="rounded-[26px]"]').filter({ hasText: marker }).first();
}

/** The "Free Tournament Pro slots remaining" panel. Only there with a grant. */
export function freeSlotsPanel(page: Page) {
  return page.getByText(KB04.FREE_SLOTS_TITLE, { exact: true })
    .locator('xpath=ancestor::div[contains(@class,"rounded")][1]');
}

/**
 * Put an account's membership back where the seed expects it.
 *
 * 04.2 is the only spec that changes one. It calls this in a `finally`, so a
 * failure halfway through the upgrade still leaves the account Free for the
 * next run - the app has no undo, so the reset has to come from the admin API
 * (docs/style-guide.md, "Actions you can only do once").
 */
export async function setMembership(userId: string, membership: 'Free' | 'Pro') {
  const r = await admin(`/admins/change-user-membership/${userId}`, {
    method: 'POST', body: { membership },
  });
  if (!r.ok) throw new Error(`change-user-membership ${userId} -> ${membership}: ${JSON.stringify(r.body)}`);
}

/**
 * Wait for /subscriptions to have finished loading.
 *
 * The page paints its heading and its two tabs before the plan content arrives
 * from `/api/prismic/subscription-plans`, so neither is a safe gate. Wait for a
 * feature line that only exists once the cards have rendered.
 */
export async function subscriptionsReady(page: Page) {
  await expect(page.getByRole('tab', { name: 'Platform Pro' })).toHaveAttribute('data-state', 'active');
  await expect(onScreen(page.getByText('Ads enabled', { exact: true })).first()).toBeVisible();
  await expect(onScreen(page.getByText('Ads Free', { exact: true })).first()).toBeVisible();
}

/**
 * One of the two platform plan cards on /subscriptions.
 *
 * Picked by a feature line unique to that card rather than by its title: the
 * strip at the top of the page repeats the title of whichever plan is active,
 * and Playwright's string `hasText` is case-insensitive, so "BASIC" also matches
 * the Pro card's "Everything in Basic". The card itself has no role and no test
 * id - the rounded border is the only structural hook it offers.
 */
export function planCard(page: Page, plan: 'basic' | 'pro') {
  const marker = plan === 'basic' ? 'Limited lineup features' : 'Unlimited substitutes in the team lineup';
  return page.locator('div[class*="rounded-[26px]"]').filter({ hasText: marker }).first();
}

/** The "Your active subscriptions plan" strip: the heading and the plan row. */
export function activePlanStrip(page: Page) {
  return page.getByText(KB04.ACTIVE_PLAN_HEADING, { exact: true }).locator('xpath=parent::div');
}

/**
 * The membership gate modal - "Friend Limit Reached", "Unlock Compare with
 * Pro", and the six others. One component, one shape: a title, a message, a
 * FREE Upgrade (Beta) button and Close.
 *
 * Radix leaves closed dialogs mounted and these gates open ON TOP of the dialog
 * that triggered them, so there are usually two in the DOM. Match on the title.
 */
export function membershipModal(page: Page, title: string) {
  return onScreen(page.locator('[role="dialog"]').filter({ hasText: title })).first();
}

/**
 * Wait for a gate modal, and prove it is the whole modal rather than a
 * half-painted one: the title, the message and the way out all present.
 */
export async function gateReady(page: Page, title: string, message: string) {
  const modal = membershipModal(page, title);
  await expect(modal).toBeVisible();
  await expect(modal.getByText(message.split('\n')[0], { exact: false })).toBeVisible();
  return modal;
}

/**
 * One of the counters in a profile header - Followers, Following, Leaderboard,
 * Views. The label is a leaf `<p>`; the click target is the tile around it.
 *
 * Do not reach for the "1 views" button instead. That is the narrow-layout copy
 * of the same control and it has a zero-sized box at 1440 wide, so a click on
 * it waits for a visible element for ever. Two other traps on this header: the
 * ratings control reads "0 reviews", which contains "views", and the counter
 * only opens anything at all when the count is above zero.
 */
export function profileCounter(page: Page, label: string) {
  return page.getByText(label, { exact: true })
    .locator('xpath=ancestor-or-self::*[contains(@class,"cursor-pointer")][1]');
}

// --- collection 05: Friends -------------------------------------------------
//
// Everything below is read by specs/05/*.spec.ts. The accounts, the friends
// list and the app's wording live in lib/fixtures-05.mjs, which
// scripts/seed-05.mjs also reads - so a spec cannot drift from the seed.
//
// Two rules shape this block.
//
// **A refused Add To Team deletes the friend.** On Free a friend may be on one
// of your teams only, and the second attempt answers 400 ONE_FRIEND_PER_TEAM
// AND soft-deletes the friend record. 05.1 photographs that refusal, so its
// spec spends a friend every run and puts it back with reviveFriend() in a
// finally. Nothing else in the collection may touch KB05.GATE_FRIEND.
//
// **Merging and claiming cannot be undone in place.** Once a friend row is
// linked to a real account its Edit control is greyed out and it has no share
// code. So 05.3 photographs the confirm and stops, and takes its "after" from
// the row the seed already linked. 05.4 does perform its claim - the whole
// article is what the other person sees - and then rebuilds the placeholder.

// @ts-ignore - plain JS module, no types
import * as KB05 from './fixtures-05.mjs';

export { KB05 };

/**
 * Collection 05's accounts, their tokens, the two teams and the friends list.
 *
 * Never hardcode an id: `scripts/seed-05.mjs` can legitimately rebuild an
 * account, a team or a friend record and every id changes. Look them up here.
 */
export async function fixtures05() {
  const read = async (key: 'free' | 'mate' | 'player' | 'claimer') => {
    const email: string = KB05.ACCOUNTS[key];
    const session = await mintSession(email);
    const me = (await asUser(session.idToken, '/users/me')).body?.data;
    if (!me) throw new Error(`${email} has no Scoryboard user. Run: node scripts/seed-05.mjs`);
    return { email, token: session.idToken as string, ...me };
  };

  const free = await read('free');
  const mate = await read('mate');
  const player = await read('player');
  const claimer = await read('claimer');

  if (free.membership !== 'Free') {
    throw new Error(
      `${free.email} is ${free.membership}, not Free. 05.1's Free gate needs it Free. ` +
      `Run: node scripts/seed-05.mjs`,
    );
  }

  const owned = (await asUser(free.token, '/teams')).body?.data ?? [];
  const teamId = (name: string) => {
    const t = owned.find((x: any) => x.name === name);
    if (!t) throw new Error(`Team "${name}" is missing. Run: node scripts/seed-05.mjs`);
    return String(t.teamId ?? t.id);
  };
  const teams = { main: teamId(KB05.TEAMS.main), other: teamId(KB05.TEAMS.other) };

  // The whole list, in order, and its order is asserted: every article here
  // photographs the list, and a row rebuilt out of turn lands at the end.
  const rows = (await asUser(free.token, '/friends')).body?.data ?? [];
  const rowName = (f: any) => `${f.name ?? ''} ${f.lastName ?? ''}`.trim();
  const order = rows.map(rowName);
  const expected = KB05.FRIENDS.map((f: any) => f.name);
  if (order.join('|') !== expected.join('|')) {
    throw new Error(
      `The friends list reads [${order.join(', ')}] and the specs expect ` +
      `[${expected.join(', ')}]. Run: node scripts/seed-05.mjs`,
    );
  }

  const friends = new Map<string, any>(rows.map((f: any) => [rowName(f), f]));
  const friend = (name: string) => {
    const f = friends.get(name);
    if (!f) throw new Error(`Friend "${name}" is missing. Run: node scripts/seed-05.mjs`);
    return f;
  };

  return { free, mate, player, claimer, teams, friends, friend };
}

/**
 * Put back a friend record that a refused Add To Team deleted.
 *
 * The deletion is soft: re-posting the same `friendPlayerId` revives the SAME
 * record id, so the row comes back where it was rather than at the end of the
 * list. Creating it by name instead would make a NEW placeholder player, leave
 * the old one on the team, and move the row - which is why this takes an id.
 */
export async function reviveFriend(token: string, friendPlayerId: string) {
  const r = await asUser(token, '/friends', { method: 'POST', body: { playerId: friendPlayerId } });
  if (!r.ok) {
    throw new Error(`Could not revive friend ${friendPlayerId}: ${JSON.stringify(r.body)}`);
  }
  return String(r.body.data.id);
}

/** Delete a friend record over the API. Used by the specs that create one. */
export async function deleteFriend(token: string, friendId: string) {
  const r = await asUser(token, `/friends/${friendId}`, { method: 'DELETE' });
  if (!r.ok) throw new Error(`Could not delete friend ${friendId}: ${JSON.stringify(r.body)}`);
}

/** Create a placeholder friend over the API, and return its record id. */
export async function createFriend(token: string, name: string) {
  const r = await asUser(token, '/friends', { method: 'POST', body: { name } });
  if (!r.ok) throw new Error(`Could not create friend "${name}": ${JSON.stringify(r.body)}`);
  return String(r.body.data.id);
}

/**
 * Wait for the friends list to have finished loading.
 *
 * The page paints its heading and its Add Friend button before `GET /friends`
 * lands, and it paints the rows before `GET /ratings` fills each one in, so
 * neither the heading nor a row on its own is a safe gate. Wait for the LAST
 * row the seed builds: the list arrives in one response, so the last name being
 * on screen means all of them are.
 */
export async function friendListReady(
  page: Page,
  last: string = KB05.FRIENDS[KB05.FRIENDS.length - 1].name,
) {
  await expect(onScreen(page.getByText(KB05.LIST_HEADING, { exact: true })).first()).toBeVisible();
  await expect(friendRow(page, last)).toBeVisible();
}

/**
 * One row of the friends list.
 *
 * Anchored on the row's own Add To Team button rather than on a class: every
 * row has one, and it is the only control every row carries. The whole row is
 * itself a button, so an ancestor search that stopped at the first `div` would
 * find the name's own wrapper instead.
 */
export function friendRow(page: Page, name: string) {
  return onScreen(page.getByText(name, { exact: true })).first()
    .locator(`xpath=ancestor::div[.//button[normalize-space()="${KB05.ADD_TO_TEAM.trigger}"]][1]`);
}

/**
 * The three-dot control at the end of a friend row.
 *
 * It carries no text and no accessible name, so it is found as the row's only
 * button with an empty label. `.last()` because the narrow-layout copies of
 * Chat and Add To Team are icon-only too and sit earlier in the row - they have
 * a zero-sized box at 1440 wide, but they are still in the DOM.
 */
export async function friendMenuButton(page: Page, name: string) {
  const row = friendRow(page, name);
  const empty = [];
  for (const b of await row.getByRole('button').all()) {
    if (!((await b.textContent())?.trim())) empty.push(b);
  }
  if (!empty.length) throw new Error(`No menu control on the row for "${name}"`);
  return empty[empty.length - 1];
}

/** Open a friend row's menu and wait for both of its items. */
export async function openFriendMenu(page: Page, name: string) {
  await (await friendMenuButton(page, name)).click();
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: KB05.ROW_MENU.edit })).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: KB05.ROW_MENU.remove })).toBeVisible();
  return menu;
}

/** Close whatever menu is open without choosing anything. */
export async function closeFriendMenu(page: Page) {
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
}

/**
 * The dialog on top.
 *
 * Radix leaves closed dialogs mounted, and this collection stacks them: the
 * merge prompt opens over the Edit dialog and the Free gate opens over Add
 * Player To Team. `.last()` is the one on top.
 */
export function topDialog(page: Page) {
  return page.locator('[role="dialog"]').locator('visible=true').last();
}

/** Close every dialog on screen, confirming nothing. */
export async function closeDialogs(page: Page) {
  for (let i = 0; i < 6; i++) {
    const open = page.locator('[role="dialog"]').locator('visible=true');
    const before = await open.count();
    if (!before) return;
    await page.keyboard.press('Escape');
    await expect
      .poll(async () => page.locator('[role="dialog"]').locator('visible=true').count(),
        { timeout: 5_000 })
      .toBeLessThan(before);
  }
  await expect(page.locator('[role="dialog"]').locator('visible=true')).toHaveCount(0);
}

/**
 * Open the Add Friend dialog and wait for the whole of it.
 *
 * Both fields and the invitation-link control have to be present: the dialog
 * animates in and a capture gated on the heading alone catches it mid-slide.
 */
export async function openAddFriend(page: Page) {
  await onScreen(page.getByRole('button', { name: KB05.ADD_BUTTON, exact: true })).first().click();
  const d = topDialog(page);
  // By role, not by text. The dialog's heading and its submit button carry the
  // same words - "Add Friend" - so a text match inside the dialog is ambiguous
  // and fails strictly.
  await expect(d.getByRole('heading', { name: KB05.ADD_DIALOG.title })).toBeVisible();
  await expect(d.getByText(KB05.ADD_DIALOG.nameLabel, { exact: true })).toBeVisible();
  await expect(d.getByText(KB05.ADD_DIALOG.generate, { exact: true })).toBeVisible();
  return d;
}

/**
 * The "Send Invitation" panel, which replaces the body of whichever dialog it
 * was opened from.
 *
 * Gated on the link field carrying a share code rather than on the heading: the
 * panel renders before `GET /friends/invite-code` or
 * `GET /friends/:id/shareCode` answers, and the link is the article's subject.
 */
export async function invitePanel(page: Page) {
  const d = topDialog(page);
  await d.getByText(KB05.EDIT_DIALOG.generate, { exact: true }).click();
  await expect(d.getByText(KB05.INVITE_PANEL.title, { exact: true })).toBeVisible();
  const field = d.locator('input[readonly]').first();
  await expect(field).toHaveValue(/shareCode=[0-9a-f]{6,}/);
  return { dialog: d, field };
}

/** The invitation link a friend row's own Generate invitation link produces. */
export async function friendShareLink(token: string, friendId: string, playerId: string) {
  const r = await asUser(token, `/friends/${friendId}/shareCode`);
  if (!r.ok) throw new Error(`No share code for friend ${friendId}: ${JSON.stringify(r.body)}`);
  return `${String(APP).replace(/\/$/, '')}/friendList?shareCode=${r.body.data.shareCode}&playerId=${playerId}`;
}

/**
 * Hide the Lottie animation inside a dialog.
 *
 * The accepted-invitation dialog in 05.4 puts a 192px Lottie box above its
 * message. Lottie draws to an inline SVG from JavaScript, so neither
 * `animations: 'disabled'` nor `reducedMotion: 'reduce'` settles it - the
 * capture catches whatever frame the player happened to be on, which is two
 * blue dots in a large white square and reads as a broken image.
 * docs/style-guide.md forbids capturing a half-rendered thing, and there is no
 * frame to wait for: the animation has no settled end state a spec can gate on.
 *
 * So the box is removed before the capture and the dialog collapses to its
 * heading, its message and its button. Matched on the SVG's own Lottie clip-path
 * ids rather than on a Tailwind size class, which is what the markup would most
 * likely change.
 */
export async function hideLottie(page: Page) {
  await page.evaluate(() => {
    for (const svg of Array.from(document.querySelectorAll('[role="dialog"] svg'))) {
      if (!svg.innerHTML.includes('__lottie_element')) continue;
      const box = svg.closest('div');
      if (box) (box as HTMLElement).style.display = 'none';
    }
  });
}

// --- 05.5: following -------------------------------------------------------
//
// Collection 06 was merged into 05 on 2026-08-31, the way 03 went into 02 and
// 16 into 04. Its one article is 05.5.
//
// The whole article rests on one observation: **the Follow control is the same
// control in all three places.** A player profile, a team page and a tournament
// page each carry it in their own header, beside their counters, and it reads
// **Follow** or **Unfollow**. So one locator serves all three.
//
// What is NOT the same is where the result shows up. Followed players and teams
// are listed in the Following window on your own profile, under a Players tab
// and a Teams tab. **A followed tournament is listed nowhere** - not in that
// window, not on the Tournament screen, and there is no endpoint that
// enumerates them. 05.5 says so, and the seed can only check the one tournament
// this collection owns.

/**
 * The Follow / Unfollow control on a player, team or tournament header.
 *
 * `exact` matters: without it "Follow" also matches "Followers", which is the
 * counter immediately beside it on every one of these three headers.
 */
export function followButton(page: Page, label: string = KB05.FOLLOW_BUTTON) {
  return onScreen(page.getByRole('button', { name: label, exact: true })).first();
}

/**
 * The header block of a player, team or tournament page - the avatar, the name,
 * the Follow control and the counters.
 *
 * Found from the Follow control rather than from the name: the three pages put
 * different things in their headers (a player has Chat and Request Payment, a
 * tournament has neither) and the Follow control is the one thing all three
 * share.
 *
 * Two ancestors are accepted, because a tournament's header is not built like
 * the other two. A player and a team sit in a white band with a bottom border;
 * a tournament sits in its own dark banner, `min-h-[280px]`, with no border at
 * all. Matched on the class ATTRIBUTE rather than as a CSS class, because
 * Tailwind's arbitrary values carry brackets that a CSS selector would need
 * escaping for - the same way collection 14 reaches its schedule cards.
 *
 * Clipping to the band is what keeps the TRENDING feed out of the captures. It
 * is global activity - other collections' fixtures and other people's accounts -
 * which docs/style-guide.md forbids in a capture and which drifts every run.
 */
// The white band a player's and a team's header sits in. It holds the banner
// AND the counters row underneath it, which is the frame these captures need -
// the banner alone cuts the counters in half.
const HEADER_BAND = 'xpath=ancestor::div[contains(@class,"bg-white") and contains(@class,"border-b")][1]';
// A tournament has no such band. Its header is its own dark banner, and the
// counters are inside it. Matched on the class ATTRIBUTE rather than as a CSS
// class: Tailwind's arbitrary values carry brackets that a CSS selector would
// need escaping for, the same way collection 14 reaches its schedule cards.
const HEADER_BANNER = 'xpath=ancestor::div[contains(@class,"min-h-[280px]")][1]';

/** The band if the page has one, otherwise the banner. */
async function headerAround(anchor: Locator) {
  const band = anchor.locator(HEADER_BAND);
  if (await band.count()) {
    await expect(band.first()).toBeVisible();
    return band.first();
  }
  const banner = anchor.locator(HEADER_BANNER);
  await expect(banner.first()).toBeVisible();
  return banner.first();
}

export async function followHeader(page: Page, label: string = KB05.FOLLOW_BUTTON) {
  const control = followButton(page, label);
  await expect(control).toBeVisible();
  return headerAround(control);
}

/**
 * The header of your OWN profile, which has no Follow control on it - you
 * cannot follow yourself - so it is found from a counter instead.
 */
export async function ownProfileHeader(page: Page, counterLabel: string) {
  const counter = followCounter(page, counterLabel);
  await expect(counter).toBeVisible();
  return headerAround(counter);
}

/**
 * Wait for a follow state to have been read from the server.
 *
 * Every one of these three pages paints its header, including the Follow
 * control, before `GET .../follow` answers - so the control can read **Follow**
 * for a moment on something you already follow. Gating on the button's own text
 * is not enough for that reason; this waits for the request to have landed by
 * asserting the label the caller expects.
 */
export async function followStateReady(page: Page, label: string) {
  await expect(followButton(page, label)).toBeVisible();
  await expect(
    onScreen(page.getByRole('button', { name: label === KB05.FOLLOW_BUTTON ? KB05.UNFOLLOW_BUTTON : KB05.FOLLOW_BUTTON, exact: true })),
  ).toHaveCount(0);
}

/** A counter tile in a profile header - Followers, Following, Leaderboard, Views. */
export function followCounter(page: Page, label: string) {
  return onScreen(page.getByText(label, { exact: true })).first()
    .locator('xpath=ancestor-or-self::*[contains(@class,"cursor-pointer")][1]');
}

/**
 * Open the Following window from your own profile and wait for both tabs.
 *
 * The tab labels are upper case through CSS, so their text is "Players (1)" and
 * "Teams (1)" rather than "PLAYERS (1)" - the same trap collection 14 hit on
 * GROUP A. Matched on the word and its count separately, because the count is
 * what the seed controls.
 */
export async function openFollowingWindow(page: Page) {
  await followCounter(page, KB05.FOLLOWING_DIALOG.title).click();
  const d = topDialog(page);
  await expect(d.getByRole('heading', { name: new RegExp(`^${KB05.FOLLOWING_DIALOG.title}`) }))
    .toBeVisible();
  await expect(d.getByText(new RegExp(`^${KB05.FOLLOWING_DIALOG.playersTab} \\(\\d+\\)$`))).toBeVisible();
  await expect(d.getByText(new RegExp(`^${KB05.FOLLOWING_DIALOG.teamsTab} \\(\\d+\\)$`))).toBeVisible();
  return d;
}

/**
 * The things 05.5 follows, looked up by name.
 *
 * Kept apart from fixtures05() so the other four specs do not pay for four
 * extra requests they have no use for. Never hardcode an id: the seed can
 * legitimately rebuild any of these.
 */
export async function fixtures05Follow() {
  const mateSession = await mintSession(KB05.ACCOUNTS.mate);
  const mate = (await asUser(mateSession.idToken, '/users/me')).body?.data;
  if (!mate) throw new Error(`${KB05.ACCOUNTS.mate} has no Scoryboard user. Run: node scripts/seed-05.mjs`);

  const owned = (await asUser(mateSession.idToken, '/teams')).body?.data ?? [];
  const teamId = (name: string) => {
    const t = owned.find((x: any) => x.name === name);
    if (!t) throw new Error(`Team "${name}" is missing. Run: node scripts/seed-05.mjs`);
    return String(t.teamId ?? t.id);
  };

  const tournaments = (await asUser(mateSession.idToken, '/tournaments')).body?.data ?? [];
  const cup = tournaments.find((t: any) => t.title === KB05.FOLLOW_TOURNAMENT);
  if (!cup) throw new Error(`${KB05.FOLLOW_TOURNAMENT} is missing. Run: node scripts/seed-05.mjs`);

  return {
    mate: { ...mate, email: KB05.ACCOUNTS.mate, token: mateSession.idToken as string },
    followedTeam: { id: teamId(KB05.FOLLOW_TEAMS.followed), name: KB05.FOLLOW_TEAMS.followed },
    unfollowedTeam: { id: teamId(KB05.FOLLOW_TEAMS.unfollowed), name: KB05.FOLLOW_TEAMS.unfollowed },
    tournament: { id: String(cup._id ?? cup.id), name: KB05.FOLLOW_TOURNAMENT as string },
  };
}

/** Follow or unfollow over the API. Used by 05.5 to put its own state back. */
export async function setFollow(
  token: string,
  kind: 'players' | 'teams' | 'tournaments',
  id: string,
  following: boolean,
) {
  const r = await asUser(token, `/${kind}/${id}/follow`, { method: following ? 'POST' : 'DELETE' });
  if (!r.ok) {
    throw new Error(`${following ? 'follow' : 'unfollow'} ${kind}/${id}: ${JSON.stringify(r.body)}`);
  }
}

// --- collection 11: Match insights & statistics -----------------------------
//
// Everything below is read by specs/11/*.spec.ts. The accounts, teams, squads,
// the four matches and the expected statistics live in lib/fixtures-11.mjs,
// which scripts/seed-11.mjs also reads - so a spec cannot drift from the seed.
//
// This collection photographs derived numbers, so the rule that shapes it is
// that no spec may change one. Every capture is a read. The single exception is
// 11.1's empty-state shot, which creates a match with no leaderboard,
// photographs it and deletes it in a `finally` - and a match outside a
// leaderboard writes no statistics at all, so nothing it does can show up in a
// number anywhere else.

// @ts-ignore - plain JS module, no types
import {
  ACCOUNTS as KB11, PROFILES as KB11_PROFILES, TEAMS as KB11_TEAMS,
  LEADERBOARD as KB11_LEAGUE, SQUADS as KB11_SQUADS, POSITIONS as KB11_POSITIONS,
  MATCH_DEFAULTS as KB11_MATCH, MATCHES as KB11_MATCHES,
  EXPECTED_PLAYER_STATS as KB11_PLAYER_STATS,
  EXPECTED_TEAM_STATS as KB11_TEAM_STATS,
} from './fixtures-11.mjs';

export {
  KB11, KB11_PROFILES, KB11_TEAMS, KB11_LEAGUE, KB11_SQUADS, KB11_POSITIONS,
  KB11_MATCH, KB11_MATCHES, KB11_PLAYER_STATS, KB11_TEAM_STATS,
};

/**
 * The collection's accounts, teams and matches, looked up rather than hardcoded.
 *
 * `scripts/seed-11.mjs --rebuild` deletes and recreates both accounts, and every
 * id changes when it does. A spec that carried an id would then point at a
 * deleted row - the lesson collections 12 and 02 both learned.
 *
 * Matches come back keyed by the `key` in lib/fixtures-11.mjs, matched on their
 * date. The four dates are distinct, which is what makes that safe.
 */
export async function fixtures11() {
  const session = async (email: string) => {
    const token: string = (await mintSession(email)).idToken;
    const me = (await asUser(token, '/users/me')).body?.data;
    if (!me?.playerId) throw new Error(`${email} is not seeded. Run: node scripts/seed-11.mjs`);
    return {
      email, token, id: String(me.id), playerId: String(me.playerId), membership: me.membership,
    };
  };
  const player = await session(KB11.player);
  const owner = await session(KB11.owner);

  const teams = (await asUser(owner.token, '/teams?all=true')).body?.data ?? [];
  const byName = (name: string) => {
    const row = teams.find((t: any) => t.name === name);
    if (!row) throw new Error(`Fixture team "${name}" is missing. Run: node scripts/seed-11.mjs`);
    return String(row.teamId);
  };
  const team = {
    home: byName(KB11_TEAMS.home),
    away: byName(KB11_TEAMS.away),
    third: byName(KB11_TEAMS.third),
  };

  const played = (await asUser(
    owner.token,
    `/teams/${team.home}/matches?scheduleType=Past&includeIncomplete=true&limit=50&skip=0`,
  )).body?.data?.result ?? [];
  const match: Record<string, string> = {};
  for (const plan of KB11_MATCHES) {
    const day = plan.date.slice(0, 10);
    const row = played.find(
      (m: any) => String(m.date).slice(0, 10) === day && m.status === 'Finished',
    );
    if (!row) throw new Error(`Match "${plan.key}" (${day}) has not been played. Run: node scripts/seed-11.mjs`);
    match[plan.key] = String(row.id);
  }

  const board = ((await asUser(owner.token, '/leaderboards')).body?.data ?? [])
    .find((b: any) => b.name === KB11_LEAGUE);
  if (!board) throw new Error(`Leaderboard "${KB11_LEAGUE}" is missing. Run: node scripts/seed-11.mjs`);

  return { player, owner, team, match, leaderboard: { id: String(board.id), name: KB11_LEAGUE } };
}

/**
 * Assert the seeded statistics are the numbers lib/fixtures-11.mjs expects.
 *
 * They are written asynchronously after a match finishes - measured at between
 * 1.6 and 6.8 seconds across this collection's four matches, which is what
 * article 11.3 is about. A capture taken before they land shows zeroes.
 *
 * This is a guard rather than a wait for something in progress: by the time a
 * spec runs, the seed is long finished. It exists so a half-run seed fails here,
 * with a readable message, rather than in a screenshot nobody looks at twice.
 *
 * expect.poll rather than a wait on a duration - docs/style-guide.md.
 */
export async function stats11Ready(fx: Awaited<ReturnType<typeof fixtures11>>) {
  await expect.poll(async () => {
    const s = (await asUser(fx.player.token, `/players/${fx.player.playerId}/stats`)).body?.data ?? {};
    return {
      totalMatches: s.winLossDraws?.totalMatches,
      wins: s.winLossDraws?.wins,
      losses: s.winLossDraws?.losses,
      draws: s.winLossDraws?.draws,
      goalsScored: s.goalsScored,
      assists: s.assists,
      playerOfMatch: s.playerOfMatch,
      yellowCards: s.yellowCards,
      redCards: s.redCards,
    };
  }, { timeout: 60_000, intervals: [2000] }).toEqual(KB11_PLAYER_STATS);

  await expect.poll(async () => {
    const s = (await asUser(fx.owner.token, `/teams/${fx.team.home}/stats`)).body?.data?.stats ?? {};
    return {
      matches: s.matches, wins: s.wins, draws: s.draws, losses: s.losses,
      goals: s.goals, conceded: s.conceded, cleanSheets: s.cleanSheets,
      winStreak: s.winStreak, yellowCards: s.yellowCards, playerOfMatch: s.playerOfMatch,
    };
  }, { timeout: 60_000, intervals: [2000] }).toEqual(KB11_TEAM_STATS);
}

/**
 * Open a match page and wait for it to have finished loading.
 *
 * Never `waitUntil: 'networkidle'` here. The match screen holds a live presence
 * connection open - the ONLINE badge on the feed - so the network never goes
 * idle and the navigation times out at 30 seconds every time. Wait for content.
 *
 * `marker` is text that proves the section this spec cares about has arrived.
 * The tab strip, the banner and the section headings all paint before any fetch
 * lands, so none of them is a safe gate.
 */
export async function openMatch(page: Page, matchId: string, marker: string) {
  await page.goto(`/match/${matchId}`, { waitUntil: 'domcontentloaded' });
  await expect(onScreen(page.getByText(marker, { exact: true })).first())
    .toBeVisible({ timeout: 30_000 });
}

/**
 * One section of the match page, by the id its tab scrolls to.
 *
 * `match-details`, `feed`, `facts`, `lineup`, `payment`, `keys`. These are the
 * app's own anchors, and each is also carried on a `data-tour` attribute, so
 * they are as stable as anything on this screen gets - far more so than walking
 * up from a heading, because every card here sits four unnamed divs deep.
 */
export function matchSection(page: Page, id: string) {
  return page.locator(`#${id}`);
}

/**
 * The white card inside a match section, rather than the section wrapper.
 *
 * `#facts` is a bare wrapper whose box starts a few pixels above the card it
 * holds, and those pixels are the banner photo behind - a clip of the wrapper
 * comes back with a dark seam along its top edge. The card itself is the only
 * child.
 */
export function matchSectionCard(page: Page, id: string) {
  return matchSection(page, id).locator('> div').first();
}

/**
 * One tab trigger on the match page, by its label.
 *
 * The strip is rendered twice - a wide layout and a narrow one - and both copies
 * carry the same accessible name, so `onScreen()` is what disambiguates them.
 *
 * NOT `[data-tab-trigger="facts"]`. That attribute is only on the copy that is
 * off-screen at 1440 wide, so the obvious-looking selector resolves to nothing
 * visible and the capture fails with "element(s) not found". The labels are upper
 * case in the DOM here - `FACTS`, not `Facts` - unlike the team page's, which are
 * upper-cased by CSS.
 *
 * And there is no clipping the strip as a whole. Both `[role="tablist"]`
 * containers have **zero height** - one is `h-0 p-0` and the other has no box at
 * all - and the tabs overflow them, so `onScreen()` discards both and falls
 * through to the Pay tablist in the payment section 3,200 pixels down the page.
 * That is what 11.1's first capture came back as on its first run. Where a shot
 * needs the strip in it, take the viewport.
 */
export function matchTab(page: Page, label: string) {
  return onScreen(page.getByRole('tab', { name: label, exact: true })).first();
}

/**
 * The Insights or the Statistics so far panel inside the Facts card.
 *
 * Both are bordered boxes headed by a blue paragraph. Found from that heading
 * and walked up one bordered ancestor, which is the box itself.
 */
export async function factsPanel(page: Page, heading: 'Insights' | 'Statistics so far') {
  const h = onScreen(matchSection(page, 'facts').getByText(heading, { exact: true })).first();
  await expect(h).toBeVisible();
  const box = h.locator('xpath=ancestor::div[contains(@class,"rounded-xl")][contains(@class,"border")][1]');
  await expect(box.getByText(heading, { exact: true })).toBeVisible();
  return box;
}

/**
 * The grid of ten statistic tiles on a TEAM page.
 *
 * Collection 02's statTiles() finds the PLAYER grid, by a label only the player
 * grid carries. This one uses Clean sheets, which only the team grid carries.
 * The two grids share six labels and differ in four, and picking the wrong one
 * is silent: both are ten tiles in the same layout.
 */
export async function teamStatTiles(page: Page) {
  const grid = statTile(page, 'Clean sheets')
    .locator('xpath=ancestor::div[contains(@class,"grid")][1]');
  await expect(grid.getByText(/^winning streaks$/i)).toBeVisible();
  await expect(grid.getByText(/^goals \/ conceded$/i)).toBeVisible();
  return grid;
}

/**
 * One of the two tiles labelled CARD.
 *
 * They carry the same label and are told apart only by a coloured rectangle:
 * `bg-[#FC334F]` is the red card and `bg-[#FEC43B]` the yellow one. On the tile
 * grids red comes first; in the Player Stats and Leaderboards tables the yellow
 * column comes first. Article 11.2 says so, because nothing on screen does.
 */
export function cardTile(page: Page, colour: 'red' | 'yellow') {
  const swatch = colour === 'red' ? 'FC334F' : 'FEC43B';
  return onScreen(page.locator(`div[class*="${swatch}"]`)).first()
    .locator('xpath=ancestor::div[contains(@class,"rounded-lg")][contains(@class,"border")][1]');
}

/**
 * The per-player table behind a team's Player Stats tab.
 *
 * Found from the Rank column header rather than from the tab: the tab paints
 * before the fetch lands, and the table replaces a set of empty rows.
 */
export async function playerStatsTable(page: Page) {
  const header = onScreen(page.locator('main').getByText('Rank', { exact: true })).first();
  await expect(header).toBeVisible();
  // NOT a rounded/bordered ancestor. Every row here is its OWN rounded card and
  // the column headers are a bare grid, so the nearest rounded ancestor of the
  // Rank header is the header strip alone - a clip of it comes back as eight
  // words and no numbers, and an assertion inside it finds no player at all.
  // The only element holding the headers and the rows together is the
  // wide-layout wrapper.
  const table = header.locator('xpath=ancestor::div[contains(@class,"xl:block")][1]');
  await expect(table.getByText('Assists', { exact: true })).toBeVisible();
  return table;
}

/**
 * One member's row in that table, found by their position.
 *
 * Position is the only cell that is unique per row here: the persona is the only
 * member with a profile, so she is the only one whose Position is anything but a
 * dash. Matching on the name instead picks up the avatar's initials too.
 */
export function playerStatsRow(table: Locator, position: string) {
  return table.getByText(position, { exact: true })
    .locator('xpath=ancestor::div[contains(@class,"grid")][1]');
}

/**
 * Create a match that belongs to no leaderboard, hand it to `body`, then delete
 * it however that goes.
 *
 * This is the one fixture in collection 11 that a spec makes for itself, and it
 * is the only way to photograph the Facts tab's empty state: insights and
 * statistics are absent exactly when a match has no leaderboard. That was
 * isolated on staging against the match tag, the other candidate - a friendly
 * that IS in a leaderboard has full insights. The tag here is `league`, the same
 * as the four seeded matches, so nothing in the capture suggests otherwise.
 *
 * The date is fixed and far in the future for two reasons. A match whose date
 * has passed cannot be deleted - DELETE answers "Date must be at least one hour
 * ahead of the current time" - and a match created with a past date starts
 * itself within seconds. A fixed future date is a deliberate trade: it goes
 * stale eventually, and 2027-09-09 buys a year of runs.
 */
export async function withoutLeaderboard(
  fx: Awaited<ReturnType<typeof fixtures11>>,
  body: (matchId: string) => Promise<void>,
) {
  const sheet = async (teamId: string, names: string[]) => {
    const rows = ((await asUser(fx.owner.token, `/teams/${teamId}/players?includeFans=true`))
      .body?.data ?? []).filter((m: any) => !m.isDeleted);
    return names.map((name, i) => {
      const row = rows.find(
        (m: any) => [m.player?.name, m.player?.lastName].filter(Boolean).join(' ') === name,
      );
      if (!row) throw new Error(`${name} is not on ${teamId}. Run: node scripts/seed-11.mjs`);
      return { teamPlayerId: String(row.id), position: KB11_POSITIONS[i] };
    });
  };
  const made = await asUser(fx.owner.token, '/matches', {
    method: 'POST',
    body: {
      homeTeam: {
        teamId: fx.team.home,
        formation: KB11_MATCH.formation,
        players: await sheet(fx.team.home, KB11_SQUADS.home.lineup),
      },
      awayTeam: {
        teamId: fx.team.away,
        formation: KB11_MATCH.formation,
        players: await sheet(fx.team.away, KB11_SQUADS.away.lineup),
      },
      date: '2027-09-09T18:00:00.000Z',
      duration: KB11_MATCH.duration,
      teamSize: KB11_MATCH.teamSize,
      tag: KB11_MATCH.tag,
    },
  });
  if (!made.ok) throw new Error(`POST /matches (no leaderboard): ${JSON.stringify(made.body)}`);
  const matchId = String(made.body.data.id);
  try {
    await body(matchId);
  } finally {
    const gone = await asUser(fx.owner.token, `/matches/${matchId}`, { method: 'DELETE' });
    if (!gone.ok) {
      throw new Error(
        `DELETE /matches/${matchId}: ${gone.status} ${JSON.stringify(gone.body)} - delete it by hand`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Collection 08 - Leaderboards & leagues
// ---------------------------------------------------------------------------
//
// Four accounts and one three-team league. The screens are the Leaderboards
// list, the board with its four tab routes, and the Edit Leaderboard settings
// page. See briefs/08.md.
//
// Three things below exist because of what step 1 found on staging, not because
// of taste:
//
//   * The **Views** tile in the board header counts every account that has ever
//     opened the board, and these specs sign four of them in - so it rises
//     between runs and is masked everywhere.
//   * Almost every control on the settings screen is rendered TWICE, once for
//     the wide layout and once for the narrow one, with the unused copy given a
//     zero-sized box. Each team row and each admin row carries two Remove
//     buttons. Everything here goes through onScreen().
//   * Removing a team from a leaderboard has NO confirmation - one click and the
//     DELETE has fired. 08.3 relies on that, and nothing else may click it.

// @ts-ignore - plain JS module, no types
import * as F08 from './fixtures-08.mjs';

export const KB08 = F08.ACCOUNTS as Record<'pro' | 'admin' | 'free' | 'outsider', string>;
export const KB08_PROFILES = F08.PROFILES;
export const KB08_LEAGUE: string = F08.LEADERBOARD;
export const KB08_THROWAWAY: string = F08.THROWAWAY;
export const KB08_TEAMS = F08.TEAMS as Record<'united' | 'rovers' | 'city' | 'athletic', string>;
export const KB08_TEAMS_IN_LEAGUE: string[] = F08.TEAMS_IN_LEAGUE;
export const KB08_TABLE = F08.EXPECTED_TABLE as Record<string, Record<string, number>>;
export const KB08_TOP_SCORER = F08.EXPECTED_TOP_SCORER as { playerName: string; goals: number };
export const KB08_COMMENTS = F08.COMMENTS as { as: string; text: string; replyTo?: number }[];
export const KB08_VENUE = F08.VENUE as { name: string; location: string };

/**
 * The collection's accounts, league, teams and matches, looked up rather than
 * hardcoded.
 *
 * `scripts/seed-08.mjs --rebuild` deletes and recreates all four accounts, and
 * every id changes when it does - so a spec that carried an id would point at a
 * deleted row. That is the lesson collections 12 and 02 both learned the
 * expensive way.
 */
export async function fixtures08() {
  const session = async (key: keyof typeof KB08) => {
    const email = KB08[key];
    const token: string = (await mintSession(email)).idToken;
    const me = (await asUser(token, '/users/me')).body?.data;
    if (!me?.playerId) throw new Error(`${email} is not seeded. Run: node scripts/seed-08.mjs`);
    return {
      email,
      token,
      id: String(me.id),
      playerId: String(me.playerId),
      membership: String(me.membership),
      name: `${me.name} ${me.lastName}`,
    };
  };
  const pro = await session('pro');
  const admin08 = await session('admin');
  const free = await session('free');
  const outsider = await session('outsider');

  if (pro.membership !== 'Pro') {
    throw new Error(`${pro.email} is ${pro.membership}, not Pro. Run: node scripts/seed-08.mjs`);
  }
  if (free.membership !== 'Free') {
    throw new Error(`${free.email} is ${free.membership}, not Free. Run: node scripts/seed-08.mjs`);
  }

  const boards = (await asUser(pro.token, '/leaderboards')).body?.data ?? [];
  const board = boards.find((b: any) => b.name === KB08_LEAGUE);
  if (!board) throw new Error(`Leaderboard "${KB08_LEAGUE}" is missing. Run: node scripts/seed-08.mjs`);
  // Nothing may be left over from a crashed 08.1: three specs photograph a
  // heading that counts what Mo owns.
  const owned = boards.filter((b: any) => b.isOwner);
  if (owned.length !== 1) {
    throw new Error(
      `${pro.email} owns ${owned.length} leaderboards (${owned.map((b: any) => b.name).join(', ')}), `
      + 'expected exactly 1. Run: node scripts/seed-08.mjs',
    );
  }

  const teams = (await asUser(pro.token, '/teams?all=true')).body?.data ?? [];
  const byName = (name: string) => {
    const row = teams.find((t: any) => t.name === name);
    if (!row) throw new Error(`Fixture team "${name}" is missing. Run: node scripts/seed-08.mjs`);
    return String(row.teamId);
  };
  const team = {
    united: byName(KB08_TEAMS.united),
    rovers: byName(KB08_TEAMS.rovers),
    city: byName(KB08_TEAMS.city),
    athletic: byName(KB08_TEAMS.athletic),
  };

  return {
    pro,
    admin: admin08,
    free,
    outsider,
    team,
    leaderboard: { id: String(board.id), name: KB08_LEAGUE },
    /** The league's team rows, flattened out of their nested shape. */
    leagueTeams: async (): Promise<{ id: string; name: string }[]> => (
      (await asUser(pro.token, `/leaderboards/${board.id}/teams`)).body?.data ?? []
    ).map((r: any) => ({ id: String(r.team?.id ?? r.teamId), name: String(r.team?.name ?? '') })),
  };
}

/**
 * Assert the league table is the one lib/fixtures-08.mjs describes.
 *
 * A guard, not a wait: by the time a spec runs the seed is long finished. It is
 * here so a half-run seed fails with a readable message rather than in a
 * screenshot nobody looks at twice. Leaderboard statistics are written
 * asynchronously after a match finishes, so expect.poll rather than a bare read.
 */
export async function table08Ready(fx: Awaited<ReturnType<typeof fixtures08>>) {
  await expect.poll(async () => {
    const rows = (await asUser(fx.pro.token, `/leaderboards/${fx.leaderboard.id}/stats/teams`))
      .body?.data ?? [];
    return Object.fromEntries(rows.map((r: any) => [r.teamName, {
      rank: r.rank,
      totalMatches: r.totalMatches,
      totalWins: r.totalWins,
      totalLosses: r.totalLosses,
      goalScored: r.goalScored,
      cleanSheets: r.cleanSheets,
    }]));
  }, {
    message: `league table is not what lib/fixtures-08.mjs expects. Run: node scripts/seed-08.mjs`,
    timeout: 60_000,
  }).toMatchObject(KB08_TABLE);
}

/**
 * Silence everything that can land on top of a leaderboard capture.
 *
 * `quiet()` covers Intercom, Stripe's frames, toasts and animations. The board
 * page also fires `GET /promo-campaigns/active?screen=Leaderboard` on every
 * load, so a campaign banner can appear over the header 08.4 photographs.
 * Blocking the request is not enough on its own - the app registers a service
 * worker, and a service worker's request never reaches page.route() - which is
 * why blockPromos() is paired with a stylesheet here rather than trusted alone.
 */
export async function quiet08(page: Page) {
  await quiet(page);
  await page.addStyleTag({
    content: `
      [data-testid="promo-campaign"], [class*="promo-campaign"] { display: none !important; }
    `,
  });
}

/**
 * Wait for the Leaderboards list to have finished loading, then return nothing.
 *
 * The heading paints as "Your Leaderboards (0)" before `GET /leaderboards`
 * lands and re-renders it with the real count - caught on the first exploration
 * pass, where a capture taken on the heading alone came back empty. So the gate
 * is the count AND the card.
 */
export async function leaderboardListReady(page: Page, count: number, names: string[]) {
  await expect(onScreen(page.getByText(`Your Leaderboards (${count})`)).first()).toBeVisible();
  for (const name of names) {
    await expect(onScreen(page.getByText(name, { exact: true })).first()).toBeVisible();
  }
  await settled08(page);
}

/** One leaderboard's card in the list, found from its name. */
export function leaderboardCard(page: Page, name: string) {
  return onScreen(page.getByText(name, { exact: true })).first()
    .locator('xpath=ancestor::div[contains(@class,"rounded-[10px]")][last()]');
}

/**
 * The share control on a leaderboard card.
 *
 * A round icon button sitting on the card's banner, with no accessible name and
 * no test id. `border-white` is the only thing that separates it from the kebab
 * beside it: the kebab is `text-white` too, but only the share button is drawn
 * with a 2px white ring. Confirmed against the card component in the bundle.
 */
export function cardShareButton(page: Page, name: string) {
  return onScreen(leaderboardCard(page, name).locator('button.border-white')).first();
}

/** The kebab menu trigger on a leaderboard card - Edit and Remove. */
export function cardMenuButton(page: Page, name: string) {
  return onScreen(
    leaderboardCard(page, name).locator('button').filter({ has: page.locator('svg.lucide-ellipsis-vertical') }),
  ).first();
}

/**
 * One of the board's tabs. Team Stats, Player Stats, Matches, Payment, Comments.
 *
 * The labels are upper-cased by CSS, so the accessible name is title case -
 * the same trap collections 14, 07 and 01 hit on GROUP A, the team tabs and
 * DELETE ACCOUNT.
 */
export function boardTab(page: Page, label: string) {
  return onScreen(page.getByRole('button', { name: label, exact: true })).first();
}

/**
 * Wait for the board to have loaded, and return its header block.
 *
 * The header, the tile row and the tab strip all paint before
 * `/leaderboards/:id` and `/stats/teams` land, so the gate is the teams count in
 * the header plus a named row from whichever panel is on screen.
 */
export async function boardReady08(page: Page, teamsJoined: number, marker: Locator) {
  await expect(onScreen(page.getByText(`${teamsJoined} Teams joined`)).first()).toBeVisible();
  await expect(marker).toBeVisible();
  await settled08(page);
  await ownTeamsResolved(page);
}

/**
 * Wait until the **External** badge has stopped being wrong.
 *
 * External marks a team that is not one of your OWN, and it is computed against
 * the account's team list - which the app fetches separately from the
 * leaderboard. Open a leaderboard screen by client-side navigation and every
 * row is badged External for a moment, then the badges vanish when that list
 * lands.
 *
 * Collection 08's first capture of the settings screen caught exactly that: all
 * three of the owner's own teams came out marked External, which would have told
 * the reader something untrue about a screen they own. Every owner-view gate here
 * therefore waits for the count to reach zero.
 *
 * NOT for a non-owner's view. An Administrator looking at somebody else's teams
 * sees the badge permanently and correctly, so this would never settle.
 */
export async function ownTeamsResolved(page: Page) {
  await expect(page.getByText('External', { exact: true })).toHaveCount(0);
}

/**
 * Open Manage Teams once, so the app knows which teams are the reader's own.
 *
 * This is the precondition `ownTeamsResolved()` needs, and finding it took a
 * whole capture cycle. The badge is computed against the `teams` slice of the
 * app's persisted store, and **only `/teams` fills that slice**. `/leaderboards`
 * fires `GET /teams?all=true` too, but the answer never reaches the slice - so a
 * session that signs in and goes straight to a leaderboard has an empty slice and
 * marks every team the reader owns as External, and keeps doing it however long
 * you wait. Ten seconds on the list changed nothing; one visit to `/teams` fixed
 * it, and it stayed fixed across a full page load, because the slice is persisted.
 *
 * Call it after signing in and before opening any leaderboard screen that lists
 * teams. A reader who has used the app at all has been to this page.
 */
export async function loadOwnTeams08(page: Page, aTeamName: string) {
  await page.goto('/teams');
  await expect(onScreen(page.getByText(aTeamName, { exact: true })).first()).toBeVisible();
  await expect(page.locator('.animate-pulse')).toHaveCount(0);
}

/** The board's header card - crest, name, teams joined, the Teams and Views tiles. */
export function boardHeader(page: Page) {
  return onScreen(page.getByText(/Teams joined$/)).first()
    .locator('xpath=ancestor::div[contains(@class,"rounded")][last()]');
}

/**
 * The number beside the Views label in the board header.
 *
 * `GET /profile-view/leaderboard/:id/viewers` counts every account that has ever
 * opened the board, and this collection signs four of them in - so it rises
 * between runs and is masked. Only the number: the word Views is part of what
 * the capture shows.
 */
export function boardViewsCount(page: Page) {
  return onScreen(page.getByText('Views', { exact: true })).first()
    .locator('xpath=preceding-sibling::*[1]');
}

/**
 * Wait for Edit Leaderboard to have loaded, and return the page heading.
 *
 * Three gates, and the third one exists because of a bad capture. The Teams
 * section arrives last - it waits on `/leaderboards/:id/teams`, which the
 * appearance and name fields do not - and its rows are badged **External** until
 * the account's own team list lands on top of them. See ownTeamsResolved().
 */
export async function settings08Ready(page: Page, name: string) {
  const h = onScreen(page.getByRole('heading', { name: `Edit Leaderboard - ${name}` })).first();
  await expect(h).toBeVisible();
  await expect(onScreen(page.getByText('Teams joined', { exact: true })).first()).toBeVisible();
  await settled08(page);
  await ownTeamsResolved(page);
  return h;
}

/**
 * One section card on Edit Leaderboard, by its heading.
 *
 * Not `settingsSection()`: Profile Appearance is a `p`, not an `h2`, while
 * BASIC INFORMATION, ROLES, TEAMS and DELETE LEADERBOARD are `h2`s. Match on
 * either, case-insensitively - the DOM casing is inconsistent and the CSS
 * upper-cases all of them anyway.
 */
export async function board08Section(page: Page, heading: string) {
  const h = onScreen(
    page.locator('main h2, main p').filter({ hasText: new RegExp(`^${heading}$`, 'i') }),
  ).first();
  await expect(h).toBeVisible();
  const card = h.locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]');
  await expect(card).toBeVisible();
  return card;
}

/**
 * One team's row in the Teams section of Edit Leaderboard.
 *
 * Found from the bordered card the name sits in, then up one level - because the
 * row's two Remove buttons are siblings of that card, not children of it.
 *
 * The obvious `ancestor::div[contains(@class,"relative")][1]` does not work, and
 * it cost 08.3 a capture run: the team name is wrapped in its own
 * `div.overflow-hidden.relative` for the marquee that truncates long names, so
 * the nearest `relative` ancestor is inside the card and contains no buttons at
 * all.
 */
export function leagueTeamRow(page: Page, name: string) {
  return onScreen(page.locator('main').getByText(name, { exact: true })).first()
    .locator('xpath=ancestor::div[contains(@class,"border") and contains(@class,"rounded-lg")][1]/..');
}

/**
 * The list of team rows under "Teams joined", and the only thing a capture of a
 * Remove control can be clipped to.
 *
 * A row's Remove button is `position: absolute` and sits to the RIGHT of the
 * bordered card, so it falls outside the row's own bounding box - clip to the row
 * and the button is not in the picture. 08.3's first run proved it: shot 06 came
 * back as a bare team name with no control and no outline in it. This container
 * spans the full column, so it holds the cards and the buttons both.
 */
export function leagueTeamsList(page: Page) {
  return onScreen(page.locator('main').getByText('Teams joined', { exact: true })).first()
    .locator('xpath=following-sibling::div[1]');
}

/**
 * The Remove button on one team row.
 *
 * Every row carries two, one per layout, and the unused one has a zero-sized
 * box. And there is no confirmation: this fires
 * `DELETE /leaderboards/:id/teams/:teamId` on the click. Only 08.3 may click it,
 * and only on the team it added itself.
 */
export function leagueTeamRemove(page: Page, name: string) {
  return onScreen(leagueTeamRow(page, name).getByRole('button', { name: 'Remove', exact: true })).first();
}

/** The dialog that is on screen, waited for by its heading. */
export async function dialog08(page: Page, heading: string) {
  const dlg = onScreen(page.locator('[role="dialog"]')).filter({ hasText: heading }).first();
  await expect(dlg).toBeVisible();
  await expect(dlg.getByText(heading, { exact: true }).first()).toBeVisible();
  return dlg;
}

/** Close the open dialog without confirming anything. */
export async function close08Dialog(page: Page) {
  const dlg = onScreen(page.locator('[role="dialog"]')).first();
  const cancel = onScreen(dlg.getByRole('button', { name: 'Cancel', exact: true }));
  if (await cancel.count()) await cancel.first().click();
  else await onScreen(dlg.getByRole('button', { name: 'Close' })).first().click();
  await expect(onScreen(page.locator('[role="dialog"]'))).toHaveCount(0);
}

/**
 * The read-only Link field and the QR code in the Share Leaderboard window.
 *
 * Both carry the leaderboard's id, which changes whenever the seed is rebuilt,
 * and docs/style-guide.md masks share codes and QR codes. The subject of the
 * capture is where the control is and what the window offers, not this
 * particular URL - so both are masked and the article says what the link looks
 * like in prose instead.
 */
export function shareLinkField(page: Page) {
  return onScreen(page.locator('input#link')).first();
}

export function shareQrCode(page: Page) {
  return onScreen(page.locator('[role="dialog"] svg').filter({ hasText: /Scan the QR code/ })).first();
}

/** The comment composer on the board - a textarea, an Add Media and a Comment. */
export function commentBox(page: Page) {
  return onScreen(page.getByPlaceholder('Write your comment...')).first();
}

/**
 * The Comments panel that sits below every board tab.
 *
 * The spinner check is not belt and braces. The panel counts its comments and
 * then keeps loading - it fetches the reply count behind "View n more replies"
 * separately - and 08.5's first capture came back with a spinner sitting under
 * the thread. docs/style-guide.md: a spinner is one of the things that must not
 * appear.
 */
export async function commentsPanel(page: Page, total: number) {
  const h = onScreen(page.getByText(`Comments (${total})`, { exact: true })).first();
  await expect(h).toBeVisible();
  await settled08(page);
  const panel = h.locator('xpath=ancestor::div[contains(@class,"rounded")][last()]');
  await expect(panel).toBeVisible();
  return panel;
}

/** No skeleton and no spinner anywhere on the page. */
export async function settled08(page: Page) {
  await expect(page.locator('.animate-pulse')).toHaveCount(0);
  await expect(page.locator('.animate-spin')).toHaveCount(0);
}

/**
 * Every absolute timestamp in the Comments panel - "01:04 PM • Aug 31, 2026".
 *
 * It is the comment's own createdAt, so it is the day the seed ran and it moves
 * on every --rebuild. docs/style-guide.md masks absolute dates that are not the
 * point of the screenshot, and 08.5's point is the composer and the thread, not
 * when the fixture was made.
 */
export function commentTimes(page: Page) {
  return page.getByText(/^\d{2}:\d{2} (AM|PM) . \w{3} \d{1,2}, \d{4}$/);
}

/**
 * One of the board's two stats tables, found from a column heading.
 *
 * The tables are CSS grids, not `<table>`s: a header row of plain divs, then a
 * sibling `div.space-y-3` holding one grid row per team or player. So the panel is
 * the nearest ancestor that has that rows container as a child.
 *
 * `ancestor::div[contains(@class,"rounded")][last()]` does not work and cost 08.4
 * a run - the header cell has no `rounded` ancestor at all, so the locator
 * resolved to nothing and the failure read as a missing table row.
 *
 * Pass `Win/Loss` for the league table and `Assists` for the player grid.
 */
export function statsPanel08(page: Page, headerCell: string) {
  return onScreen(page.locator('main').getByText(headerCell, { exact: true })).first()
    .locator('xpath=ancestor::div[div[contains(@class,"space-y-3")]][1]');
}

/**
 * One fixture card on the Matches panel, found from something printed on it.
 *
 * The cards are the children of a `div.space-y-4` inside the active tab panel, and
 * they carry a long generated class list with no id and no test hook - so the card
 * is "the ancestor whose parent is that container". Walking up by class does not
 * work: several nested divs inside a card carry `rounded-*` too, and 08.4's first
 * run picked one of those and could not find the VS in it.
 *
 * The panel renders a wide and a narrow layout, so onScreen() is not optional.
 */
export function fixtureCard08(page: Page, marker: string) {
  return onScreen(page.locator('main').getByText(marker, { exact: true })).first()
    .locator('xpath=ancestor::div[parent::div[contains(@class,"space-y-4")]][1]');
}

/** The Past / Upcoming tabs on the Matches panel. They are real `role="tab"`s. */
export function matchesTab(page: Page, label: 'Past Matches' | 'Upcoming Matches') {
  return onScreen(page.getByRole('tab', { name: label, exact: true })).first();
}

/** The Select teams filter on the Matches panel. */
export function teamFilter(page: Page) {
  return onScreen(page.getByText('Select teams', { exact: true })).first()
    .locator('xpath=ancestor-or-self::button[1]');
}

/**
 * Put the leaderboard's teams back to the three the fixture describes.
 *
 * 08.3 adds KB 08 Athletic and takes it out again, and it must leave the league
 * as it found it whether or not it got that far - docs/style-guide.md, "a spec
 * that consumes or mutates a fixture puts it back itself". Idempotent: it reads
 * the league first and writes only what is wrong.
 */
export async function restoreLeagueTeams(fx: Awaited<ReturnType<typeof fixtures08>>) {
  const want = new Set(KB08_TEAMS_IN_LEAGUE.map((k) => (KB08_TEAMS as any)[k] as string));
  for (const row of await fx.leagueTeams()) {
    if (want.has(row.name)) { want.delete(row.name); continue; }
    const gone = await asUser(
      fx.pro.token, `/leaderboards/${fx.leaderboard.id}/teams/${row.id}`, { method: 'DELETE' },
    );
    if (!gone.ok) throw new Error(`DELETE league team ${row.name}: ${JSON.stringify(gone.body)}`);
  }
  for (const name of want) {
    const teamId = Object.entries(KB08_TEAMS).find(([, v]) => v === name)?.[0];
    const id = teamId ? (fx.team as any)[teamId] : undefined;
    if (!id) throw new Error(`cannot restore "${name}" - no id`);
    const back = await asUser(fx.pro.token, `/leaderboards/${fx.leaderboard.id}/teams`, {
      method: 'POST', body: { teamId: id },
    });
    if (!back.ok) throw new Error(`POST league team ${name}: ${JSON.stringify(back.body)}`);
  }
}

/**
 * Delete every leaderboard Mo owns except the fixture one.
 *
 * 08.1 creates a throwaway to photograph the result of creating one, and has to
 * remove it again: the "Your Leaderboards (1)" heading is on three other specs'
 * captures. Runs in a `finally`, and is safe to call when nothing was created.
 */
export async function dropThrowaway08(fx: Awaited<ReturnType<typeof fixtures08>>) {
  const boards = (await asUser(fx.pro.token, '/leaderboards')).body?.data ?? [];
  for (const b of boards) {
    if (!b.isOwner || b.name === KB08_LEAGUE) continue;
    const gone = await asUser(fx.pro.token, `/leaderboards/${b.id}`, { method: 'DELETE' });
    if (!gone.ok) {
      throw new Error(
        `DELETE /leaderboards/${b.id} ("${b.name}"): ${gone.status} `
        + `${JSON.stringify(gone.body)} - delete it by hand, or three other specs will photograph it`,
      );
    }
  }
}

/**
 * The bits of chrome that move between runs, ready to hand to `shot({mask})`.
 *
 * Two of them, and both were caught in collection 08's first capture run:
 *
 *   * the unread-notification badge. `hideNotificationBadge()` scopes to
 *     `sidebar()`, and on these pages the bell sits outside that container, so
 *     it matched nothing and a red 6 went into the screenshot. Hiding it in the
 *     page did not work either: the count arrives after the page has settled, so
 *     the badge appeared after the call. A mask is evaluated at capture time,
 *     which is the only moment that is late enough.
 *   * every **Created on 31/08/2026** line. `createdOn()` takes `.first()`, and
 *     08.1 photographs a list with two cards in it - the second card's date came
 *     out unmasked.
 *
 * Deliberately NOT `.first()` and NOT `onScreen()`: a mask locator that matches
 * several elements masks all of them, and an element with no box is a no-op.
 */
export function moving08(page: Page) {
  return [
    // Three different things on these pages are a red circle, and two of them
    // must not be masked. `w-5` is what tells them apart, and both of the others
    // reached a published-looking capture before it was pinned down:
    //
    //   w-5 h-5   absolute   the unread-notification badge          <- mask this
    //   h-2.5     absolute   the dot marking an unregistered player
    //   (no size) static     a player's initials avatar
    //
    // Without `absolute`, Ike KB's face was painted out of the player grid.
    // Without `w-5`, every player's dot became a dark square.
    page.locator('div[class*="bg-red-500"][class*="rounded-full"][class*="absolute"][class*="w-5"]'),
    page.getByText(/^Created on /),
  ];
}

/**
 * Move the pointer off the page content.
 *
 * Playwright leaves the mouse wherever it last clicked, and these tables give the
 * row under the cursor a pale blue background. 08.4's player grid came back with
 * one row highlighted for no reason a reader could see - it was simply where the
 * Player Stats tab had been. Park the pointer before any capture that follows a
 * click.
 */
export async function parkPointer(page: Page) {
  await page.mouse.move(0, 0);
}

// ---------------------------------------------------------------------------
// collection 09: Creating & scheduling matches
// ---------------------------------------------------------------------------
//
// The match page is one long page with a tab strip that scrolls to sections
// rather than swapping them, so everything is in the DOM at once and nearly
// every locator here needs onScreen() or a container to scope it.
//
// Two things about it govern all seven specs.
//
// 1. **The page renders differently before and after the match is complete.**
//    An `Incomplete` match shows an editable MATCH DETAILS **form** with a Save
//    changes button. A `Scheduled` one shows a read-only **detail strip** -
//    referee, leaderboard, date, venue, pitch, kick-off, team size, duration -
//    and the form is gone. Editing then happens in the gear menu's Edit dialog.
//    A spec must know which of the two it is looking at.
//
// 2. **A team the reader does not own renders as a placeholder until the app has
//    loaded /teams once.** Open `/matches/:id` directly as somebody who is not
//    the owner of both sides and the page reads "Add Away Team", "Not set" and
//    "Location not set" over perfectly good data. Going to /teams first fixes it.
//    Collection 08 hit the same store slice, where it showed up as a wrong
//    External badge. warm09() is the fix; call it before every match capture that
//    is not made as the owner.

// @ts-ignore - plain JS module, no types
import * as F09 from './fixtures-09.mjs';

export const KB09 = F09.ACCOUNTS as Record<'pro' | 'admin' | 'player' | 'referee', string>;
export const KB09_PROFILES = F09.PROFILES;
export const KB09_LEADERBOARD: string = F09.LEADERBOARD;
export const KB09_TEAMS = F09.TEAMS as Record<'united' | 'rovers', string>;
export const KB09_VENUES = F09.VENUES as Record<'astro' | 'park', { name: string; location: string }>;
export const KB09_MATCHES = F09.MATCHES as {
  key: string; home: string; away: string; date: string; venue: string;
  duration: string; teamSize: string; tag: string; pitchNumber?: string;
  note?: string; referee?: boolean;
}[];
export const KB09_GAME_TYPES = F09.GAME_TYPES as { label: string; tag: string }[];
export const KB09_TEAM_SIZES: string[] = F09.TEAM_SIZES;
export const KB09_DEFAULTS = F09.MATCH_DEFAULTS as { duration: string; teamSize: string; formation: string };
export const KB09_POSITIONS: string[] = F09.POSITIONS;
export const KB09_SQUADS = F09.SQUADS;

/**
 * The clock every collection-09 spec freezes to: 2026-09-01T09:00:00Z.
 *
 * Two screens need it. `/schedule` opens on whatever month the browser thinks it
 * is, and both fixtures are in September. And the Scheduled match page carries a
 * live "Match starts in 23d 08h 00m 00s" countdown that ticks every second - a
 * capture of it is different every run unless the clock is pinned.
 *
 * Call it AFTER signing in. The Firebase token exchange needs a real clock.
 */
export const FROZEN_NOW_09 = new Date(F09.FROZEN_NOW);

export async function freezeClock09(page: Page) {
  await page.clock.setFixedTime(FROZEN_NOW_09);
}

/**
 * Look the collection-09 fixtures up by the values the seed used.
 *
 * Never a hardcoded id: the seed can legitimately rebuild a match, and a
 * hardcoded id would then point at a Cancelled row that still answers 200.
 */
export async function fixtures09() {
  const session = await mintSession(KB09.pro);
  const token: string = session.idToken;
  const me = (await asUser(token, '/users/me')).body?.data;

  const teams = (await asUser(token, '/teams?all=true')).body?.data ?? [];
  const teamId = (name: string) => {
    const row = teams.find((t: any) => t.name === name);
    if (!row) throw new Error(`Team "${name}" is missing. Run: node scripts/seed-09.mjs`);
    return String(row.teamId);
  };

  const boards = (await asUser(token, '/leaderboards')).body?.data ?? [];
  const board = boards.find((b: any) => b.isOwner && b.name === KB09_LEADERBOARD);
  if (!board) throw new Error(`Leaderboard "${KB09_LEADERBOARD}" is missing. Run: node scripts/seed-09.mjs`);

  const venue = async (key: 'astro' | 'park') => {
    const want = KB09_VENUES[key].name;
    const rows = (await asUser(token, `/club-locations?query=${encodeURIComponent(want)}`)).body?.data ?? [];
    const row = rows.find((v: any) => v.name === want && !v.isDeleted);
    if (!row) throw new Error(`Venue "${want}" is missing. Run: node scripts/seed-09.mjs`);
    return String(row.id);
  };

  // Matched on the seeded date, which is fixed per fixture, and Cancelled rows are
  // skipped - a crashed spec leaves one behind and it keeps its date.
  const listed = (await asUser(
    token,
    `/players/${me.playerId}/matches?includeIncomplete=true&startDate=2026-01-01&endDate=2027-12-31`,
  )).body?.data;
  const rows = listed?.result ?? listed ?? [];
  const matchByKey: Record<string, string> = {};
  for (const plan of KB09_MATCHES) {
    const day = plan.date.slice(0, 10);
    const row = (Array.isArray(rows) ? rows : []).find(
      (m: any) => String(m.date ?? '').slice(0, 10) === day && m.status !== 'Cancelled',
    );
    if (!row) throw new Error(`Match "${plan.key}" (${day}) is missing. Run: node scripts/seed-09.mjs`);
    matchByKey[plan.key] = String(row.id);
  }

  return {
    token,
    userId: String(me.id),
    playerId: String(me.playerId),
    teams: { united: teamId(KB09_TEAMS.united), rovers: teamId(KB09_TEAMS.rovers) },
    leaderboard: { id: String(board.id), name: board.name as string },
    venue,
    match: matchByKey,
    detail: async (id: string) => (await asUser(token, `/matches/${id}`)).body?.data,
    /** A bare Incomplete match, exactly as the app's Create Match button makes one. */
    async throwaway(homeTeamId?: string) {
      const body: Record<string, unknown> = { status: 'Incomplete' };
      if (homeTeamId) {
        body.homeTeam = { teamId: homeTeamId, formation: KB09_DEFAULTS.formation, players: [] };
        body.teamSize = KB09_DEFAULTS.teamSize;
      }
      const r = await asUser(token, '/matches', { method: 'POST', body });
      if (!r.ok) throw new Error(`POST /matches: ${JSON.stringify(r.body)}`);
      return String(r.body.data.id);
    },
    /**
     * Dispose of a match a spec created.
     *
     * DELETE does not delete - it answers "Match cancelled successfully" and sets
     * status Cancelled. A Cancelled row is invisible in the calendar, in a team's
     * match lists and in the leaderboard's, so this is a clean teardown even
     * though nothing is removed. PUT {status} is the fallback for the cases
     * DELETE refuses.
     */
    async cancel(id: string) {
      let r = await asUser(token, `/matches/${id}`, { method: 'DELETE' });
      if (!r.ok) r = await asUser(token, `/matches/${id}`, { method: 'PUT', body: { status: 'Cancelled' } });
      return r.status;
    },
  };
}

/** Everything that must be off-screen before a collection-09 capture. */
export async function quiet09(page: Page) {
  await page.addStyleTag({
    content: `
      #intercom-container, .intercom-lightweight-app, #intercom-frame,
      iframe[name^="__privateStripe"], #stripeDataLayerFrame,
      [data-testid="promo-campaign"], [role="status"], [aria-live="polite"] {
        display: none !important;
      }
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
    `,
  });
  await expect(page.locator('#intercom-container')).toBeHidden();
}

/**
 * Load Manage Teams once, so a team the reader does not own resolves.
 *
 * Not tidiness. Open `/matches/:id` straight from the address bar as somebody who
 * is not the owner of both teams and the page renders "Add Away Team", "Not set"
 * for the leaderboard and referee, and "Location not set" for the venue - over
 * data that is perfectly present in `GET /matches/:id`. Going to /teams first
 * fills the store slice the match page reads those names out of, and the same
 * page then renders every one of them. Proved on staging 2026-08-31 with the
 * plain-Player account, twice each way.
 */
export async function warm09(page: Page) {
  await page.goto('/teams');
  await expect(
    page.getByText(/Manage Teams|Add Team|Create Team/i).first(),
  ).toBeVisible({ timeout: 30_000 });
}

/**
 * The match page's own header menus, in DOM order.
 *
 * There is no id, no aria-label and no test id on any of them, and how many there
 * are depends on the match's status:
 *
 *   Incomplete   [gear]
 *   Scheduled    [Add to Calendar] [gear]
 *
 * plus the language menu down in the footer, which is inside `main` as well. So
 * neither `.first()` nor `.last()` finds the gear on both. The Add to Calendar
 * button is the one carrying a `lucide-calendar` icon; excluding it leaves the
 * gear first in the DOM, before the footer's.
 *
 * Every caller asserts what the opened menu says, so a change in the app fails
 * the spec rather than photographing the wrong menu.
 */
export function matchGear(page: Page) {
  return page
    .locator('button[aria-haspopup="menu"]')
    .filter({ hasNot: page.locator('svg.lucide-calendar') })
    .first();
}

export function matchAddToCalendar(page: Page) {
  return page
    .locator('button[aria-haspopup="menu"]')
    .filter({ has: page.locator('svg.lucide-calendar') })
    .first();
}

/** Open the gear menu and prove it is the gear menu. */
export async function openMatchGear(page: Page) {
  await matchGear(page).click();
  const menu = page.locator('[role="menu"]').first();
  await expect(menu).toBeVisible();
  await expect(menu.getByText('Cancel Match', { exact: true })).toBeVisible();
  return menu;
}

/**
 * The share button - the pill beside the tab strip that opens **Share a match**.
 *
 * It carries no id, no aria-label, no title and no text, and it is not a menu, so
 * every obvious handle is missing. What is left: among the buttons in `main` that
 * have no text and no `aria-haspopup`, it is the only one holding an `svg.w-5.h-5`
 * (the header's three icons are `w-6 h-6` and two of them are menus). Checked
 * against every textless button on the page, 2026-08-31.
 *
 * openShareMatch() asserts the window it opens, so a change in the app fails the
 * spec rather than clicking something else.
 */
export function shareMatch09(page: Page) {
  return onScreen(
    page
      .locator('main button:not([aria-haspopup])')
      .filter({ has: page.locator('svg.w-5.h-5') })
      .filter({ hasNotText: /\S/ }),
  ).first();
}

/** Open the Share a match window and prove it. */
export async function openShareMatch(page: Page) {
  await shareMatch09(page).click();
  const dlg = namedDialog09(page, 'Share a match');
  await expect(dlg).toBeVisible({ timeout: 30_000 });
  await expect(dlg.getByText('Share public link', { exact: true })).toBeVisible();
  return dlg;
}

/** Open the Add to Calendar menu and prove it. */
export async function openAddToCalendar(page: Page) {
  await matchAddToCalendar(page).click();
  const menu = page.locator('[role="menu"]').first();
  await expect(menu).toBeVisible();
  await expect(menu.getByText('Google', { exact: true })).toBeVisible();
  return menu;
}

/**
 * The notification bell in the sidebar, and the panel it opens.
 *
 * The bell is a bare inline `svg` with no button, no role, no id and no
 * aria-label, wrapped in a `div.relative` inside a `cursor-pointer` row - so every
 * role-based query misses it, and `svg.lucide-bell` finds only the `md:hidden`
 * mobile copy, which has a zero-sized box. The class trio on the desktop one is
 * what identifies it.
 *
 * The panel is headed "Notifications (n)" and its rows read
 * "Match scheduled <home> X <away> on <date> at <venue>" - note **Match
 * scheduled**, not "Match invitation", which is how the same `MatchInvitation`
 * notification is worded in the home page's Trending strip. 09.7 photographed the
 * Trending strip by mistake on its first run and would have said the wrong thing.
 */
export function notificationBell09(page: Page) {
  // The `>` matters. `filter({has: ...})` matches any `div.relative` that has such
  // an svg ANYWHERE inside it, and `.first()` then returns an outer wrapper that
  // is not the bell - the click lands on empty sidebar and nothing opens. The
  // child combinator names the bell's own wrapper.
  return onScreen(page.locator('div.relative:has(> svg.w-6.h-6.text-neutral-600)')).first();
}

export async function openNotifications09(page: Page) {
  await notificationBell09(page).click();
  // Gate on the panel's own control rather than on a role: the panel is a portal
  // whose outer element carries no heading role.
  await expect(page.getByText('Mark all as read', { exact: true })).toBeVisible({ timeout: 30_000 });
  // The innermost box that holds the header AND a row. Filtering on the header
  // alone returns the header strip - "Notifications (2)", Refresh and Mark all as
  // read sit in a container of their own, above the list.
  const panel = page.locator('div')
    .filter({ hasText: 'Mark all as read' })
    .filter({ hasText: /Match scheduled/ })
    .last();
  await expect(panel).toBeVisible();
  return panel;
}

/**
 * Every relative timestamp in the notifications panel - "5 minutes ago".
 *
 * It is the notification's own createdAt against the wall clock, so it moves on
 * every run and on every re-seed. docs/style-guide.md masks dates that are not the
 * point of the screenshot, and 09.7's point is that the notification exists at
 * all, not when it arrived.
 */
export function notificationTimes09(page: Page) {
  return page.getByText(/^\d+ (second|minute|hour|day|month|year)s? ago$/);
}
/**
 * The one dialog on screen, whichever it is.
 *
 * `.last()` and not `.first()`, because a window opened from the match page sits
 * on top of nothing - but do NOT hold on to this while you work inside a window.
 * Several controls in the Update your match dialog open their own popover with
 * `role="dialog"` on it - the venue picker is one - and `.last()` then points at
 * the popover instead of the window. Use namedDialog09() for anything you need to
 * keep a handle on.
 */
export function dialog09(page: Page) {
  return page.getByRole('dialog').last();
}

/**
 * A dialog identified by its own heading, so the handle survives whatever the
 * dialog opens on top of itself.
 *
 * 09.3 spent two runs on this: clicking the venue box inside Update your match
 * opens a suggestion popover that is also a `role="dialog"`, so the handle from
 * `.last()` moved onto the popover and every field lookup after it timed out
 * waiting for an input that was never in there.
 */
export function namedDialog09(page: Page, heading: string) {
  // `page.locator('[role="dialog"]')` and not `getByRole('dialog')`, and
  // `hasText` and not a nested `getByRole('heading')`. Both halves matter.
  //
  // Radix marks a dialog's content `aria-hidden` while a Select inside it is open,
  // which takes the dialog out of the accessibility tree - so an ARIA-based
  // locator resolves to NOTHING the moment you open one of the dialog's own
  // dropdowns. 09.6 lost two captures to that: the Configure appearance window
  // and the Referee box both open a Select, and the clip locator went dead at
  // exactly the moment the shot was taken. A CSS attribute selector does not care.
  return page.locator('[role="dialog"]').filter({ hasText: heading });
}

/**
 * Close whatever windows are open, innermost first.
 *
 * One press is not enough. A Select, a date picker or a suggestion list opened
 * inside a window is its own `role="dialog"` popover sitting on top of it, and the
 * window's Close button underneath is not clickable until that has gone. 09.6 hung
 * here with the theme list still open over the Configure appearance window.
 *
 * Counted rather than timed, so nothing waits on a duration.
 */
export async function closeDialog09(page: Page) {
  const dialogs = page.locator('[role="dialog"]');
  // Escape twice, unconditionally. The first press closes whatever popover is
  // open inside the window - a Select, a date picker, a suggestion list - and the
  // second closes the window. Clicking Close first does not work: while a Select
  // is open the button underneath it is not clickable and the click waits out its
  // whole timeout. Counting the popovers does not work either, because a Radix
  // Select's popover is not a `role="dialog"` and the count never changes.
  for (let i = 0; i < 4; i += 1) {
    if ((await dialogs.count()) === 0) return;
    await page.keyboard.press('Escape');
  }
  // A suggestion list that reopens while its box still has focus survives Escape
  // however many times you press it - the Referee box does exactly that. Take the
  // focus off it by clicking the window's own heading, then use Close.
  const win = dialogs.first();
  const heading = win.locator('h1, h2').first();
  if (await heading.count()) await heading.click({ force: true });
  const close = win.getByRole('button', { name: 'Close' });
  if (await close.count()) await close.last().click({ force: true });
  await expect(dialogs).toHaveCount(0);
}

/**
 * Open the gear menu's Edit dialog - "Update your match".
 *
 * It prefills from the match, which is worth knowing because it does NOT on an
 * Incomplete one: there is nothing to prefill, so the same dialog opens blank
 * with placeholder crests reading YT and OT. The one field that never prefills is
 * Referee, even when the match has one. See lib/fixtures-09.mjs.
 */
export async function openUpdateMatch(page: Page) {
  const menu = await openMatchGear(page);
  await menu.getByText('Edit', { exact: true }).click();
  const dlg = namedDialog09(page, 'Update your match');
  await expect(dlg).toBeVisible();
  return dlg;
}

/** Open the gear menu's Configure appearance window. */
export async function openConfigureAppearance(page: Page) {
  const menu = await openMatchGear(page);
  await menu.getByText('Configure appearance', { exact: true }).click();
  const dlg = namedDialog09(page, 'Configure appearance');
  await expect(dlg).toBeVisible();
  return dlg;
}

/**
 * The MATCH DETAILS form, which exists only while the match is Incomplete.
 *
 * Its selects are real `select` elements behind styled triggers, so selectOption
 * works: `leaderboard`, `teamSize` and `tag`.
 */
export async function matchForm09(page: Page) {
  const form = page.locator('form').filter({ has: page.getByRole('button', { name: 'Save changes' }) }).first();
  await expect(form).toBeVisible();
  return form;
}

/** No skeleton and no spinner anywhere on the page. */
export async function settled09(page: Page) {
  await expect(page.locator('.animate-pulse')).toHaveCount(0);
  await expect(page.locator('.animate-spin')).toHaveCount(0);
}

/**
 * The MATCH DETAILS card - the teams, the score, the countdown and, on a
 * Scheduled match, the detail strip under them.
 *
 * This is the subject of most of this collection's captures, and clipping to it
 * is what keeps them off the FEED panel below.
 *
 * Note the **lower case**. The card's caption reads MATCH DETAILS on screen and
 * its text is `match details` - it is uppercased by CSS, the same
 * `text-transform` trap collections 14, 01 and 07 hit on GROUP A, DELETE ACCOUNT
 * and the team tabs. `getByText('MATCH DETAILS', {exact: true})` matches the two
 * tab buttons instead, whose text really is upper case, and the first version of
 * this helper walked up from a tab and returned the tab strip.
 */
export async function matchCard09(page: Page) {
  await settled09(page);
  const caption = page.getByText('match details', { exact: true });
  await expect(caption).toBeVisible({ timeout: 30_000 });
  const card = caption.locator('xpath=ancestor::div[contains(@class,"bg-white")][1]');
  await expect(card).toBeVisible();
  return card;
}

/**
 * The read-only detail strip on a Scheduled match: referee, leaderboard, date,
 * venue, pitch, kick-off, team size, duration.
 *
 * Scoped by the venue name, which is the one value in it that is unique to this
 * collection's fixtures. The strip has no heading and no test id.
 *
 * Waiting for it is also how a spec knows a Save landed: on an Incomplete match
 * the strip does not exist at all, and the editable form stands in its place.
 */
export async function detailStrip09(page: Page, venueName: string) {
  const cell = page.getByText(venueName, { exact: true }).first();
  await expect(cell).toBeVisible({ timeout: 30_000 });
  const strip = cell.locator('xpath=ancestor::div[count(div) >= 4][1]');
  await expect(strip).toBeVisible();
  return strip;
}

/**
 * The FEED panel - the note line, the livestream placeholder and Comment.
 *
 * Same lower-case trap as matchCard09: the caption reads FEED on screen and its
 * text is `Feed`.
 */
export async function feedPanel09(page: Page) {
  await settled09(page);
  const caption = page.getByText('Feed', { exact: true }).first();
  await expect(caption).toBeVisible({ timeout: 30_000 });
  const panel = caption.locator('xpath=ancestor::div[contains(@class,"bg-white")][1]');
  await expect(panel).toBeVisible();
  return panel;
}

/**
 * The live countdown, for masking.
 *
 * freezeClock09() pins it, so it reads the same every run and is normally left
 * visible - it is part of what the reader sees. Mask it only where the shot is
 * about something else and the extra digits distract.
 */
export function countdown09(page: Page) {
  return page.getByText('Match starts in').locator('xpath=..');
}

/** A date cell in either date picker, by the accessible name the app gives it. */
export function dayCell(page: Page, name: string) {
  return page.getByRole('button', { name, exact: true });
}

/** Step the visible month of an open date picker. */
export async function nextMonth(page: Page) {
  await page.getByRole('button', { name: 'Go to the Next Month' }).click();
}

/**
 * A fixture card on a team page, scoped by something inside it.
 *
 * The cards carry no heading and no test id; the venue name and the Finish Setup
 * button are what tell one from another.
 */
export async function fixtureCard09(page: Page, marker: string | RegExp) {
  const inner = typeof marker === 'string'
    ? page.getByText(marker, { exact: true }).first()
    : page.getByText(marker).first();
  await expect(inner).toBeVisible({ timeout: 30_000 });
  // Filtered from the outside in rather than walked up from the marker. Walking
  // up with `ancestor::div[.//*[contains(text(),"VS")]][1]` returned the
  // three-row details grid - the nearest ancestor on that axis - and 09.2's fifth
  // capture came back as a 640x150 sliver of two icons. Asking for the innermost
  // rounded box that holds BOTH the marker and the HOME badge names the card
  // itself.
  const card = page.locator('div[class*="rounded"]')
    .filter({ has: typeof marker === 'string' ? page.getByText(marker, { exact: true }) : page.getByText(marker) })
    .filter({ has: page.getByText('HOME', { exact: true }) })
    .last();
  await expect(card).toBeVisible();
  return card;
}

/**
 * The /schedule calendar's three view buttons.
 *
 * A segmented control of three icon buttons. Only the third carries a text
 * label; all three carry `data-state` "on" or "off", and the icon class is what
 * tells them apart:
 *
 *   lucide-list      Day - one day, with a month picker beside it
 *   lucide-columns2  Week
 *   lucide-grid3x3   Month - the default, and the only one labelled
 */
export function calendarView(page: Page, which: 'day' | 'week' | 'month') {
  const icon = { day: 'lucide-list', week: 'lucide-columns2', month: 'lucide-grid3x3' }[which];
  return page.locator(`button:has(svg.${icon})`).first();
}

/**
 * Wait for the calendar to have drawn its month and its fixtures.
 *
 * "Scheduled Matches" is styled as a heading but is not one - it has no heading
 * role - so this matches the text. Gating on the fixture count as well is what
 * proves the month's fetch landed: the grid draws its empty cells first.
 */
export async function calendarReady09(page: Page, entries: number) {
  await expect(page.getByText('Scheduled Matches', { exact: true }).first())
    .toBeVisible({ timeout: 30_000 });
  await expect(
    page.getByText(`${KB09_TEAMS.united} vs ${KB09_TEAMS.rovers}`),
  ).toHaveCount(entries, { timeout: 30_000 });
  // The calendar keeps a spinner beside Create Match while it refetches, and it
  // came out in the middle of 09.1's first capture before this line existed.
  await settled09(page);
}

/**
 * The signed-in user's identity in the sidebar. Masked in every capture that
 * includes it - docs/style-guide.md.
 */
export function sidebarIdentity09(page: Page, name: string) {
  return page.getByText(name, { exact: true }).first();
}

/**
 * The things on these screens that move between runs, for masking.
 *
 * The unread-notification badge is the only one that must always be masked: the
 * count depends on what the other three accounts have done since, and no article
 * is about it. `w-5` is what tells it apart from a player's unregistered dot and
 * from an initials avatar - collection 08 painted out a player's face before that
 * was pinned down.
 */
export function moving09(page: Page) {
  return [
    page.locator('div[class*="bg-red-500"][class*="rounded-full"][class*="absolute"][class*="w-5"]'),
    page.getByText(/^Joined Since /),
  ];
}

// --- collection 10: Match day -----------------------------------------------
//
// Everything from the whistle onwards. Collection 09 stops at kick-off.
//
// Five facts shape every helper below, and all five are in config/api.md under
// "The match lifecycle":
//
//   1. A Finished match is permanent. Nothing reopens it, nothing edits it.
//   2. A match starts itself when its date arrives, and is born Finished if it
//      would have ended more than 24 hours ago.
//   3. POST /matches/:id/status {"status":"Live"} forces a future match Live -
//      which is what START MATCH does.
//   4. PUT /matches/:id is refused with 403 while a match is Live.
//   5. Events land only while a match is Live or Paused.
//
// So no spec here changes either shared fixture. Every article that starts,
// scores, cards or ends a match builds its own throwaway in the KB 10 Scratch
// leaderboard and cancels it in a `finally`.

// @ts-ignore - plain JS module, no types
import * as F10 from './fixtures-10.mjs';

export const KB10 = F10.ACCOUNTS as Record<'pro' | 'admin' | 'player' | 'referee', string>;
export const KB10_PROFILES = F10.PROFILES;
export const KB10_LEADERBOARD: string = F10.LEADERBOARD;
export const KB10_SCRATCH: string = F10.SCRATCH_LEADERBOARD;
export const KB10_TEAMS = F10.TEAMS as Record<'united' | 'rovers', string>;
export const KB10_VENUE = F10.VENUE as { name: string; location: string };
export const KB10_DEFAULTS = F10.MATCH_DEFAULTS as { duration: string; teamSize: string; formation: string };
export const KB10_POSITIONS: string[] = F10.POSITIONS;
export const KB10_SQUADS = F10.SQUADS;
export const KB10_MATCHES = F10.MATCHES;
export const KB10_PLAYED_SCORE = F10.PLAYED_SCORE as { home: number; away: number };
export const KB10_PLAYED_EVENTS = F10.PLAYED_EVENTS;
export const KB10_PLAYED_COMMENTARY = F10.PLAYED_COMMENTARY as { minute: number; description: string }[];
export const KB10_TIMER_MINUTES: number = F10.LIVE_TIMER_MINUTES;

/**
 * Look the collection-10 fixtures up, and work out what clock to freeze to.
 *
 * There is deliberately no `FROZEN_NOW` constant in this collection. The played
 * fixture's date is whatever moment the seed ran - it has to be, because events
 * are only accepted while a match is Live and a match is only Live inside its own
 * duration - so a hardcoded clock would drift against it on every rebuild and the
 * feed would start reading "in four hours". `frozenNow` is derived from the
 * fixture instead: three hours after the played match kicked off. That is stable
 * for as long as the fixture is.
 *
 * Never a hardcoded id either: the seed can legitimately rebuild a match.
 * `scheduled` is found by its fixed future date; `played` is found by being the
 * one Finished match in KB 10 Sunday League.
 */
export async function fixtures10() {
  const session = await mintSession(KB10.pro);
  const token: string = session.idToken;
  const me = (await asUser(token, '/users/me')).body?.data;

  const teams = (await asUser(token, '/teams?all=true')).body?.data ?? [];
  const teamId = (name: string) => {
    const row = teams.find((t: any) => t.name === name);
    if (!row) throw new Error(`Team "${name}" is missing. Run: node scripts/seed-10.mjs`);
    return String(row.teamId);
  };

  const boards = (await asUser(token, '/leaderboards')).body?.data ?? [];
  const board = (name: string) => {
    const row = boards.find((b: any) => b.isOwner && b.name === name);
    if (!row) throw new Error(`Leaderboard "${name}" is missing. Run: node scripts/seed-10.mjs`);
    return String(row.id);
  };

  const venueRows = (await asUser(
    token, `/club-locations?query=${encodeURIComponent(KB10_VENUE.name)}`,
  )).body?.data ?? [];
  const venue = venueRows.find((v: any) => v.name === KB10_VENUE.name && !v.isDeleted);
  if (!venue) throw new Error(`Venue "${KB10_VENUE.name}" is missing. Run: node scripts/seed-10.mjs`);

  const detail = async (id: string) => (await asUser(token, `/matches/${id}`)).body?.data;

  // The calendar's own endpoint - the only listing that carries Incomplete rows,
  // and one that never shows Cancelled ones.
  const listed = (await asUser(
    token,
    `/players/${me.playerId}/matches?includeIncomplete=true&startDate=2026-01-01&endDate=2027-12-31`,
  )).body?.data;
  const rows: any[] = listed?.result ?? listed ?? [];
  const league = board(KB10_LEADERBOARD);

  const schedDay = KB10_MATCHES.scheduled.date.slice(0, 10);
  const schedRow = rows.find(
    (m) => String(m.date ?? '').slice(0, 10) === schedDay && m.status === 'Scheduled',
  );
  if (!schedRow) {
    throw new Error(`The Scheduled fixture (${schedDay}) is missing. Run: node scripts/seed-10.mjs`);
  }

  let playedId: string | null = null;
  for (const m of rows) {
    if (m.status !== 'Finished') continue;
    if (String((await detail(String(m.id)))?.leaderboardId) === league) { playedId = String(m.id); break; }
  }
  if (!playedId) {
    throw new Error(`The Finished fixture in "${KB10_LEADERBOARD}" is missing. Run: node scripts/seed-10.mjs`);
  }
  const played = await detail(playedId);

  const squad = async (id: string) => {
    const all = (await asUser(token, `/teams/${id}/players?includeFans=true`)).body?.data ?? [];
    return all.filter((m: any) => !m.isDeleted).map((m: any) => ({
      id: String(m.id),
      role: m.role as string,
      name: [m.player?.name, m.player?.lastName].filter(Boolean).join(' '),
    }));
  };

  const united = teamId(KB10_TEAMS.united);
  const rovers = teamId(KB10_TEAMS.rovers);
  const scratch = board(KB10_SCRATCH);

  return {
    token,
    userId: String(me.id),
    playerId: String(me.playerId),
    teams: { united, rovers },
    leaderboard: league,
    scratch,
    venue: String(venue.id),
    scheduled: String(schedRow.id),
    played: playedId,
    playedDetail: played,
    /** Three hours after the played fixture kicked off. See the note above. */
    frozenNow: new Date(new Date(played.date).getTime() + F10.FROZEN_AFTER_PLAYED_HOURS * 3600_000),
    detail,
    squad,

    /**
     * A throwaway match in KB 10 Scratch, in whichever state the caller wants.
     *
     * `scheduled` dates it three days ahead, so it carries a START MATCH button a
     * spec may photograph without pressing.
     *
     * `live` dates it `minutesAgo` in the past and waits for the server to start
     * it. Deliberately not `POST /status`: going through the real auto-start is
     * what puts "Match was created from the past date" on the feed, which is
     * article 10.9's subject.
     *
     * `stale` dates it far enough back that it would have ended more than 24
     * hours ago, so it arrives **Finished at 0-0 and can never be scored**. That
     * is 10.9's warning. Such a match cannot be cancelled either - it stays in
     * KB 10 Scratch, which no article photographs.
     */
    async throwaway(
      when: 'scheduled' | 'live' | 'stale',
      { minutesAgo = 3, lineups = true } = {},
    ) {
      const home = await squad(united);
      const away = await squad(rovers);
      const pick = (members: { id: string; name: string }[], order: string[]) => order.map((n, i) => {
        const row = members.find((m) => m.name === n);
        if (!row) throw new Error(`${n} is not on the squad. Run: node scripts/seed-10.mjs`);
        return { teamPlayerId: row.id, position: KB10_POSITIONS[i] };
      });
      // A clock read, inside a spec. Allowed here and nowhere else: what the
      // fixture needs is a RELATIVE offset - far enough in the past that the
      // server starts it - and no absolute instant stays true between runs.
      // Nothing photographed depends on this value; freezeClock10() pins what the
      // reader sees.
      const now = Date.now();
      const date = when === 'scheduled'
        ? new Date(now + 3 * 86_400_000).toISOString()
        : when === 'live'
          ? new Date(now - minutesAgo * 60_000).toISOString()
          : new Date(now - 30 * 3600_000).toISOString();
      const r = await asUser(token, '/matches', {
        method: 'POST',
        body: {
          homeTeam: {
            teamId: united,
            formation: KB10_DEFAULTS.formation,
            players: lineups ? pick(home, KB10_SQUADS.united.lineup) : [],
          },
          awayTeam: {
            teamId: rovers,
            formation: KB10_DEFAULTS.formation,
            players: lineups ? pick(away, KB10_SQUADS.rovers.lineup) : [],
          },
          date,
          duration: KB10_DEFAULTS.duration,
          teamSize: KB10_DEFAULTS.teamSize,
          clubLocationId: String(venue.id),
          leaderboardId: scratch,
          tag: 'league',
        },
      });
      if (!r.ok) throw new Error(`POST /matches: ${JSON.stringify(r.body)}`);
      const id = String(r.body.data.id);
      const want = when === 'scheduled' ? 'Scheduled' : when === 'live' ? 'Live' : 'Finished';
      // Polled on the status, never on a duration: the server does the work and
      // there is no event to await. Bounded, so a spec fails rather than hangs.
      for (let i = 0; i < 40; i += 1) {
        const m = await detail(id);
        if (m?.status === want) return { id, match: m, home, away };
        if (when === 'scheduled') break;
        await new Promise((res) => setTimeout(res, 1500));
      }
      throw new Error(`Throwaway ${id} never reached ${want} (it is ${(await detail(id))?.status})`);
    },

    /**
     * A blank Incomplete match, exactly as the app's **Create Match** button makes
     * one.
     *
     * `POST /matches {"status":"Incomplete"}` is what the button sends, and it
     * lands the reader on `/matches/:id` with an editable MATCH DETAILS form in
     * place of the read-only detail strip. That form is where article 10.9 starts,
     * and it exists only while the match is Incomplete - a Scheduled match has no
     * form to photograph.
     */
    async blank() {
      const r = await asUser(token, '/matches', { method: 'POST', body: { status: 'Incomplete' } });
      if (!r.ok) throw new Error(`POST /matches {Incomplete}: ${JSON.stringify(r.body)}`);
      return String(r.body.data.id);
    },

    /**
     * Dispose of a throwaway.
     *
     * DELETE refuses a match whose date has passed - "Date must be at least one
     * hour ahead of the current time" - so it cannot clear one that was born
     * Live. `PUT {status: "Cancelled"}` can. Neither works on a Finished match:
     * that is permanent, which is why the throwaways live in KB 10 Scratch and
     * nothing photographs it.
     */
    async cancel(id: string) {
      let r = await asUser(token, `/matches/${id}`, { method: 'DELETE' });
      if (!r.ok) {
        r = await asUser(token, `/matches/${id}`, { method: 'PUT', body: { status: 'Cancelled' } });
      }
      return r.status;
    },

    /** Put a persona's whole profile back. See the note on closeTour(). */
    async restoreProfile(role: 'pro' | 'admin' | 'player' | 'referee') {
      const s = await mintSession(KB10[role]);
      const who = (await asUser(s.idToken, '/users/me')).body?.data;
      const r = await asUser(s.idToken, `/users/${who.id}`, {
        method: 'PUT', body: (KB10_PROFILES as any)[role],
      });
      return r.status;
    },
  };
}

export type Fx10 = Awaited<ReturnType<typeof fixtures10>>;

/**
 * Freeze the browser clock.
 *
 * Three different instants are used across this collection, each derived from the
 * fixture it belongs to rather than written down:
 *
 *   fx.frozenNow                       the two shared fixtures
 *   afterKickOff(m, KB10_TIMER_MINUTES) a Live match, so the timer reads 48:00
 *   afterKickOff(m, 61)                 full time, so END MATCH is on screen
 *
 * Call it AFTER signing in - the Firebase token exchange needs a real clock.
 */
export async function freezeClock10(page: Page, when: Date) {
  await page.clock.setFixedTime(when);
}

/**
 * `startedAt` plus `minutes`, for a capture of a running timer.
 *
 * The timer runs from **`startedAt`** - the instant the server actually started
 * the match - and not from the kick-off time in the match details. Those two are
 * minutes apart for a throwaway dated in the past, and getting it wrong is
 * visible: the first run of 10.3 froze the clock at `date + 12 min` and the pill
 * read **51:03**, because the server had started the match three minutes after
 * its nominal kick-off and the timer had only nine minutes to count.
 *
 * `startedAt + 12 min` on a 60-minute match puts exactly **48:00** on screen.
 * Pass the match object the throwaway helper returned - it was read after the
 * status went Live, so it carries `startedAt`.
 */
export function afterKickOff(match: any, minutes: number) {
  const started = match?.startedAt;
  if (!started) {
    throw new Error('afterKickOff(): the match has no startedAt - was it read before it went Live?');
  }
  return new Date(new Date(started).getTime() + minutes * 60_000);
}

/** Everything that must be off-screen before a collection-10 capture. */
export async function quiet10(page: Page) {
  await page.addStyleTag({
    content: `
      #intercom-container, .intercom-lightweight-app, #intercom-frame,
      iframe[name^="__privateStripe"], #stripeDataLayerFrame,
      [data-testid="promo-campaign"], [role="status"], [aria-live="polite"] {
        display: none !important;
      }
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
    `,
  });
  await expect(page.locator('#intercom-container')).toBeHidden();
}

/**
 * Load Manage Teams once before opening a match.
 *
 * The same store slice collection 09 found: open `/matches/:id` cold and the
 * venue reads "Location not set" and the away team "Add Away Team" over data the
 * API returns perfectly. Loading `/teams` first fills it. It bites the owner too,
 * not only a reader who does not own both teams - proved on this collection's own
 * Scheduled fixture, where KB 10 Astro rendered as "Location not set" on a cold
 * load and correctly after a visit to /teams.
 */
export async function warm10(page: Page) {
  await page.goto('/teams');
  await expect(page.getByText(/Manage Teams|Add Team|Create Team/i).first())
    .toBeVisible({ timeout: 30_000 });
}

/** No skeleton and no spinner anywhere on the page. */
export async function settled10(page: Page) {
  await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 30_000 });
  await expect(page.locator('.animate-spin')).toHaveCount(0, { timeout: 30_000 });
}

/** Warm the store, freeze the clock, open a match page and settle it. */
export async function openMatch10(page: Page, id: string, when?: Date) {
  await warm10(page);
  if (when) await freezeClock10(page, when);
  await page.goto(`/matches/${id}`);
  await quiet10(page);
  await settled10(page);
}

/**
 * One of the match page's six panels, by its anchor id.
 *
 * All six are in the DOM at once - the tab strip scrolls to anchors rather than
 * swapping content - so a panel can be clipped without clicking its tab.
 */
export function matchPanel(
  page: Page,
  id: 'match-details' | 'feed' | 'facts' | 'lineup' | 'payment' | 'keys',
) {
  return page.locator(`#${id}`);
}

/**
 * A tab in the strip.
 *
 * Two copies exist, one per layout, and the off-screen one has a zero-sized box,
 * so `.first()` alone can return the invisible one.
 */
export function matchTab10(page: Page, label: string) {
  return onScreen(page.getByRole('tab', { name: label, exact: true })).first();
}

/** The whole tab strip, for a capture of the navigation itself. */
export async function tabStrip10(page: Page) {
  const tab = matchTab10(page, 'MATCH DETAILS');
  await expect(tab).toBeVisible({ timeout: 30_000 });
  const strip = tab.locator('xpath=..');
  await expect(strip).toBeVisible();
  return strip;
}

/**
 * The control beside the tab strip changes with the match's status:
 *
 *   Incomplete / Scheduled   START MATCH
 *   Live                     the timer pill, counting down, pause icon
 *   Paused                   the same pill, play icon
 *   Live at 00:00            END MATCH
 *   Finished                 nothing at all
 */
// Named with a case-insensitive regex rather than a string, because half the
// upper-case text on this page is CSS and half is real - see onlinePill() - and
// which half a given control belongs to is not worth finding out one failed run
// at a time.
export function startMatchButton(page: Page) {
  return onScreen(page.getByRole('button', { name: /^start match$/i })).first();
}

export function endMatchButton(page: Page) {
  return onScreen(page.getByRole('button', { name: /^end match$/i })).first();
}

/**
 * The timer pill - which is also the pause control; they are one button.
 *
 * Matched on its text, `mm:ss`, counting DOWN from the match duration, because
 * that is the only thing it carries. `onScreen` matters twice over: the mobile
 * copy is in the DOM with a zero-sized box, and clicking that copy waits out the
 * whole action timeout instead of failing.
 */
export function timerPill(page: Page) {
  return onScreen(page.locator('button').filter({ hasText: /^\d?\d:\d\d$/ })).first();
}

/**
 * The digits inside the timer pill, separately from its icon.
 *
 * `<div class="font-bold text-center ...">48:00</div>`, a sibling of the `svg`.
 * Needed because the paused capture masks the number and keeps the icon.
 *
 * **Why the paused number is masked.** While the match is Live the pill is drawn
 * from the browser clock, so a frozen clock pins it exactly. The moment it is
 * paused the pill is drawn from the `pausedAt` the SERVER stamps - real
 * wall-clock time, and the server ignores a `pausedAt` sent in the body - so the
 * figure jumps to however long the spec took to get there, about forty seconds,
 * and no test clock can pin it. A run of 10.4 read 48:00 live and 59:40 paused,
 * one second apart.
 *
 * A real user never sees that jump: their browser clock and the server's agree.
 * It is an artefact of freezing the clock, not a fault in the product - which is
 * why the fix is to mask the digits rather than to write a warning into the
 * article. The icon is what the reader needs, and the icon is what the shot keeps.
 */
export function timerDigits(page: Page) {
  return timerPill(page).locator('div').filter({ hasText: /^\d?\d:\d\d$/ }).first();
}

/**
 * Every place the running clock is drawn: the pill and the figure under the score.
 *
 * Both have to be masked together in a paused capture, and 10.3 shipped one run
 * that masked only the pill - leaving 59:46 sitting under the score, three inches
 * from a previous screenshot that read 48:00.
 */
export function timerFigures(page: Page) {
  return [
    timerDigits(page),
    onScreen(matchPanel(page, 'match-details').getByText(/^\d?\d:\d\d$/)).first(),
  ];
}

/**
 * The two score steppers under the MATCH DETAILS card.
 *
 * One rounded blue-bordered row holds four 32px buttons in DOM order: home minus,
 * home plus, away minus, away plus. They carry no text, no id and no aria-label,
 * so the order is the only handle - and the count is asserted before it is
 * indexed, so a change in the app fails the spec rather than clicking the wrong
 * control.
 *
 * A minus button is `disabled` at zero, which is also how a spec can tell a goal
 * landed without reading the score.
 */
export async function scoreStepperRow(page: Page) {
  const row = page.locator('div[class*="rounded-full"][class*="border-blue-600"]')
    .filter({ has: page.locator('button.w-8.h-8') }).first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  return row;
}

export async function scoreStepper(page: Page, side: 'home' | 'away', which: 'plus' | 'minus') {
  const row = await scoreStepperRow(page);
  const buttons = row.locator('button.w-8.h-8');
  await expect(buttons).toHaveCount(4);
  const index = (side === 'home' ? 0 : 2) + (which === 'minus' ? 0 : 1);
  return buttons.nth(index);
}

/** The score between the two crests, e.g. "3 - 1". */
export function scoreText(page: Page) {
  return onScreen(page.getByText(/^\d+ - \d+$/)).first();
}

/** The feed's action bar - Yellow Card, Red Card, Player of Match, Comment. */
export function feedAction(
  page: Page,
  label: 'Yellow Card' | 'Red Card' | 'Player of Match' | 'Comment',
) {
  // Whitespace-tolerant and case-insensitive. These four labels are real text
  // rather than CSS upper case - unlike the ONLINE pill - but the markup wraps
  // each one around an icon, so the accessible name can carry extra whitespace.
  const name = new RegExp(`^${label.split(' ').join('\\s+')}$`, 'i');
  return onScreen(page.getByRole('button', { name })).first();
}

/**
 * A window on the match page, identified by its own heading.
 *
 * A CSS attribute selector rather than `getByRole('dialog')`, and `hasText`
 * rather than a nested heading query - the trap collection 09 documented. Radix
 * marks a dialog `aria-hidden` while a Select inside it is open, which takes it
 * out of the accessibility tree, and every ARIA-based locator on it goes dead at
 * exactly the moment the shot is taken.
 */
export function matchDialog10(page: Page, heading: string) {
  return page.locator('[role="dialog"]').filter({ hasText: heading });
}

/** Open one of the feed's event windows and prove which one it is. */
export async function openFeedDialog(
  page: Page,
  label: 'Yellow Card' | 'Red Card' | 'Player of Match' | 'Comment',
  heading: string,
) {
  await feedAction(page, label).scrollIntoViewIfNeeded();
  await feedAction(page, label).click();
  const dlg = matchDialog10(page, heading);
  await expect(dlg.first()).toBeVisible({ timeout: 30_000 });
  return dlg.first();
}

/** Close every window, innermost first. Counted, never timed. */
export async function closeDialog10(page: Page) {
  const dialogs = page.locator('[role="dialog"]');
  for (let i = 0; i < 4; i += 1) {
    if ((await dialogs.count()) === 0) return;
    await page.keyboard.press('Escape');
  }
  const win = dialogs.first();
  const close = win.getByRole('button', { name: 'Close' });
  if (await close.count()) await close.last().click({ force: true });
  await expect(dialogs).toHaveCount(0);
}

/**
 * A substitute slot's clickable `+`, by slot number.
 *
 * The label and the `+` are siblings inside one `div.flex.flex-col`, and only the
 * `+` carries the click handler - clicking the label does nothing at all, which
 * cost two exploration runs. SUB-4 is drawn in violet where the first three are
 * blue, and it is the one the Free gate sits on.
 */
export function subSlot(page: Page, n: 1 | 2 | 3 | 4 | 5) {
  // Anchored on the label and stepped up exactly one level, because the label
  // and the clickable `+` are SIBLINGS inside a small wrapper. The first version
  // of this filtered every `div.flex.flex-col` that contained the label, which
  // matches the whole pitch column as well - and `.first()` then returned one of
  // the eleven other `cursor-pointer` divs inside it. The click landed on a
  // player's place, nothing opened, and 10.2 failed twice on a window that was
  // never asked for.
  return onScreen(page.getByText(`SUB-${n}`, { exact: true })).first()
    .locator('xpath=..')
    .locator('div.cursor-pointer')
    .first();
}

/**
 * The Substitutes block inside one team's pitch column: the heading and the grid
 * of slots.
 *
 * Scoped to the column rather than searched for on the page, because both teams
 * have one and the two are identical. `mt-6` is what tells the block apart from
 * the grid inside it - the block's own class list begins with the string
 * "undefined", which is a template bug in the app and not something to match on.
 */
export function substitutesBlock(column: Locator) {
  return column.locator('div.flex.flex-col.gap-4.mt-6').first();
}

/** The Formation combobox for one side of the LINEUP panel. */
export function formationSelect(page: Page, side: 'home' | 'away') {
  const boxes = onScreen(page.getByRole('combobox').filter({ hasText: /Formation/ }));
  return side === 'home' ? boxes.first() : boxes.last();
}

/**
 * The membership gate this collection raises - "Add More Subs", "Add Media".
 *
 * Found by its **FREE Upgrade (Beta)** button rather than by its heading, and the
 * reason is a trap worth knowing: Playwright's `hasText` string filter matches a
 * **case-insensitive substring**. `matchDialog10(page, 'Add Media')` therefore
 * also matches the **Add comment** window sitting underneath it, because that
 * window contains the words "Add media" - so `.first()` returned the wrong dialog
 * and 10.8 failed looking for an upgrade button in a comment box.
 *
 * The upgrade button is on the gate and on nothing else, so it is the safe anchor.
 * The heading is then asserted against the dialog that was found, which is the
 * right way round.
 */
export async function gate10(page: Page, title: string) {
  const dlg = page.locator('[role="dialog"]')
    .filter({ has: page.getByText('FREE Upgrade (Beta)', { exact: true }) })
    .first();
  await expect(dlg).toBeVisible({ timeout: 30_000 });
  await expect(dlg.getByText(title, { exact: true }).first()).toBeVisible();
  return dlg;
}

/**
 * The live viewer count on the FEED panel.
 *
 * Two traps in one small pill, and 10.1's first run walked into both. Its text is
 * **`🟢 Online 1`** - a leading emoji, and **title case uppercased by CSS**
 * (`text-xs uppercase`). So `getByText('ONLINE 1', {exact: true})` finds nothing,
 * and so does `getByText(/ONLINE \d+/)`: it matched zero elements, the mask
 * silently painted nothing, and the pill went into the capture. Same
 * `text-transform` trap this repo has now hit on GROUP A, DELETE ACCOUNT and the
 * MATCH DETAILS caption.
 *
 * Masked in every capture except 10.10's, whose subject it is: the number depends
 * on how many sessions happen to be open.
 */
export function onlinePill(page: Page) {
  return onScreen(page.getByText(/online \s*\d+/i)).first();
}

/** The guided tour's current step. Shepherd.js - see config/api.md. */
export type TourStep = 'match-details-section' | 'feed-section' | 'lineup-section';

export function tourStep(page: Page, stepId: TourStep) {
  return page.locator(`dialog.shepherd-element[data-shepherd-step-id="${stepId}"]`);
}

export function showTourButton(page: Page) {
  return page.locator('#show-tour-button');
}

/**
 * Wait for a tour step to have drawn its text.
 *
 * `innerText` on `.shepherd-text` reads empty - the dialog sits outside the
 * layout the way innerText measures it - so the wait is on `textContent`.
 */
export async function tourStepReady(page: Page, stepId: TourStep) {
  const step = tourStep(page, stepId);
  await expect(step).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(
    (id) => {
      const el = document.querySelector(
        `dialog.shepherd-element[data-shepherd-step-id="${id}"] .shepherd-text`,
      );
      return !!el && (el.textContent ?? '').trim().length > 0;
    },
    stepId,
    { timeout: 30_000 },
  );
  return step;
}

/** Advance the tour by its own Next button. */
export async function tourNext(page: Page) {
  await page.locator('dialog.shepherd-element .shepherd-button-primary').click();
}

/**
 * Close the tour with its x rather than with Finish.
 *
 * Both **Skip Tour** and **Finish** fire `PUT /users/:id {isTourCompleted:true}`,
 * which is a full replace and therefore clears the account's bio - verified on
 * staging 2026-09-01 (config/api.md). The x is the one exit that is not a footer
 * button. 10.1's spec restores the profile in a `finally` regardless, because
 * none of the three exits can be trusted not to write.
 */
export async function closeTour(page: Page) {
  const cancel = page.locator('dialog.shepherd-element .shepherd-cancel-icon');
  if (await cancel.count()) await cancel.first().click();
  await expect(page.locator('dialog.shepherd-element')).toHaveCount(0);
}

/** The finished-match card's own words. */
export function matchEndedNotice(page: Page) {
  return onScreen(page.getByText('The match has ended and cannot be edited.')).first();
}

/** The signed-in user's name in the sidebar. Masked in every capture. */
export function sidebarIdentity10(page: Page, name: string) {
  return page.getByText(name, { exact: true }).first();
}

/**
 * The things on these screens that move between runs, for masking.
 *
 * The unread-notification badge changes with whatever the other three accounts
 * have done since, and the ONLINE pill changes with how many sessions are open.
 * Neither is the subject of any article except 10.10, whose spec passes
 * `keepOnline` so the pill survives.
 */
export function moving10(page: Page, { keepOnline = false } = {}) {
  const out = [
    page.locator('div[class*="bg-red-500"][class*="rounded-full"][class*="absolute"][class*="w-5"]'),
    page.getByText(/^Joined Since /),
  ];
  if (!keepOnline) out.push(onlinePill(page));
  return out;
}

/**
 * Wait for the KEYS panel to have drawn its legend.
 *
 * The panel is a collapsible whose body is
 * `overflow-hidden transition-all max-h-[2000px]`, and it opens a render after
 * the page settles. Measured cold it is 82 CSS pixels tall - just the header -
 * and 314 once the legend is in. `quiet10()` kills the transition, so there is
 * nothing to wait out; what has to be waited for is React swapping `max-h-0`
 * for `max-h-[2000px]`.
 *
 * 10.1's first run clipped to `#keys` before that happened and produced an
 * 83-pixel strip with the header and the top edge of four pills. This is the
 * condition that run was missing - a height, not a duration.
 */
export async function keysPanelReady(page: Page) {
  const panel = matchPanel(page, 'keys');
  await panel.scrollIntoViewIfNeeded();
  await expect(panel.getByText('Player Of The Match', { exact: true }).first()).toBeVisible({
    timeout: 30_000,
  });
  await page.waitForFunction(
    () => (document.getElementById('keys')?.getBoundingClientRect().height ?? 0) > 200,
    undefined,
    { timeout: 30_000 },
  );
  return panel;
}

/**
 * One team's half of the LINEUP panel: the Formation control, the pitch and the
 * Substitutes bench.
 *
 * The whole panel is 1645 CSS pixels tall because each team's half is a row of
 * [Team Members list][Formation + pitch + bench], so a clip of `#lineup` is a
 * portrait of four columns. 10.1 wants that overview; 10.2 wants this, which is
 * the part a reader actually works in.
 *
 * Found by walking up from the Formation combobox to the nearest ancestor that
 * also holds the Substitutes heading. Walking up a fixed number of levels would
 * break the moment a wrapper is added; this names the relationship instead.
 */
export async function pitchColumn(page: Page, side: 'home' | 'away') {
  const trigger = formationSelect(page, side);
  await expect(trigger).toBeVisible({ timeout: 30_000 });
  const column = trigger.locator('xpath=ancestor::div[.//*[text()="Substitutes"]][1]');
  await expect(column).toBeVisible();
  return column;
}

// --- collection 15: publishing & running a tournament -----------------------
//
// The board tabs collection 15 owns are Presentation, Sponsor, Prizes, Chat,
// Results and Participants, plus the public page at `/tournament/:id/<tab>` and
// the fullscreen slide show at `/tournament/:id/slideshow`.
//
// Two things every spec here needs and no earlier collection provided: a public
// page reached with no session at all, and a fixture lookup that also hands back
// the group and bracket ids the slide show references.

export const KB15 = {
  organiser: 'kb-organiser-15@yopmail.com',
  admin: 'kb-15-admin@yopmail.com',
  free: 'kb-15-free@yopmail.com',
  outsider: 'kb-15-outsider@yopmail.com',
} as const;

/** The fixture names the seed uses. A spec must never invent one. */
export const KB15_TOURNAMENTS = {
  cup: 'KB 15 Cup',
  league: 'KB 15 League',
  padelCup: 'KB 15 Padel Cup',
  sunday: 'KB 15 Sunday League',
  newCup: 'KB 15 New Cup',
  doneCup: 'KB 15 Done Cup',
} as const;

export const KB15_SPONSORS = ['KB Astro Sports', 'KB Riverside Cafe'] as const;

/**
 * The clock every collection 15 spec freezes to.
 *
 * The slide show renders a live wall clock when `showCurrentTime` is set, and the
 * chat stamps every message. Both change every run. A fixed time is the style
 * guide's answer; this one is a Saturday morning in BST, which is when a
 * tournament screen would actually be on.
 */
export const FROZEN_NOW_15 = new Date('2026-09-05T09:15:00.000Z');

export async function freezeClock15(page: Page) {
  await page.clock.setFixedTime(FROZEN_NOW_15);
}

/**
 * Look collection 15's fixtures up by title, and carry the ids the slide show
 * and the results articles need.
 *
 * Never hardcode an id: `scripts/seed-15.mjs` can legitimately recreate a
 * tournament, and a hardcoded id would then point at a deleted row.
 */
export async function fixtures15() {
  const email = personaEmail('organiser', '15');
  const session = await mintSession(email);
  const token: string = session.idToken;
  const list = (await asUser(token, '/tournaments')).body.data ?? [];
  const byTitle = (t: string) => {
    const row = list.find((x: any) => x.title === t);
    if (!row) throw new Error(`Fixture tournament "${t}" is missing. Run: node scripts/seed-15.mjs`);
    return String(row._id ?? row.id);
  };
  const detail = async (id: string) => (await asUser(token, `/tournaments/${id}`)).body.data;
  return {
    email,
    token,
    cup: byTitle(KB15_TOURNAMENTS.cup),
    league: byTitle(KB15_TOURNAMENTS.league),
    padelCup: byTitle(KB15_TOURNAMENTS.padelCup),
    sunday: byTitle(KB15_TOURNAMENTS.sunday),
    newCup: byTitle(KB15_TOURNAMENTS.newCup),
    doneCup: byTitle(KB15_TOURNAMENTS.doneCup),
    detail,
    /** The group ids of one tournament, keyed by the name on the board. */
    groups: async (id: string) => Object.fromEntries(
      ((await detail(id)).groups ?? []).map((g: any) => [g.name, String(g.id)])),
    /** One group's fixture cards, in board order. */
    groupMatches: async (id: string, groupId: string) =>
      (await asUser(token, `/tournaments/${id}/schedule/groups/${groupId}/matches`)).body.data ?? [],
  };
}

/**
 * One tab in the public page's strip: Info, Participants, Standings, Matches,
 * Leaderboard, Chat.
 *
 * Pass the TITLE-CASE name even though the screenshot will read INFO. The tabs
 * are upper-cased by CSS and their DOM text is title case, so that is the
 * accessible name - checked rather than assumed, because collections 01 and 14
 * both hit strips where the upper case was in the markup instead (GROUP A,
 * DELETE ACCOUNT). `getByRole('button', {name: 'INFO'})` matches nothing here.
 */
export function publicTab(page: Page, label: string) {
  return onScreen(page.getByRole('button', { name: label, exact: true })).first();
}

/**
 * A browser context that has never been signed in, for the public captures.
 *
 * Clearing cookies is not enough to sign out of this app: the Firebase session
 * lives in IndexedDB, not in a cookie, so a page that has signed in stays signed
 * in however much cookie clearing it is given. A second context is the only
 * honest way to photograph what a stranger sees.
 *
 * The settings repeat playwright.config.ts on purpose - a context made here does
 * not inherit the `use` block - and they must stay in step with it, or the public
 * captures come out at a different scale from every other screenshot.
 */
export async function publicContext(browser: Browser) {
  return browser.newContext({
    baseURL: process.env.SCORYBOARD_APP_BASE,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    timezoneId: 'Europe/London',
    locale: 'en-GB',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
}

/**
 * Open the public tournament page on a page that has never signed in.
 *
 * This is the one share link in the project a signed-out visitor really does get
 * in full - unlike the leaderboard and match ones, which bounce to /signin. Pass
 * a page from `publicContext()`. The clock is frozen before the first paint
 * because the Info tab stamps a date.
 */
export async function openPublicPage(page: Page, tournamentId: string, tab = 'info') {
  await freezeClock15(page);
  await page.goto(`/tournament/${tournamentId}/${tab}`);
  await expect(publicTab(page, 'Info')).toBeVisible({ timeout: 30_000 });
  await quiet(page);
}

/** The public page's whole tab strip, for a capture of which tabs are showing. */
export async function publicTabStrip(page: Page) {
  const info = publicTab(page, 'Info');
  await expect(info).toBeVisible();
  const strip = info.locator('xpath=ancestor::div[.//button][1]');
  await expect(strip).toBeVisible();
  return strip;
}

/**
 * Wait for a board tab to have finished loading.
 *
 * Every tab paints its chrome - header, tab strip - before its fetch lands, so
 * the tab strip is never a safe gate. `marker` is something only the loaded tab
 * has.
 */
export async function board15Ready(page: Page, marker: Locator) {
  await expect(marker).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.animate-pulse')).toHaveCount(0);
}

/** A named card or section on the board, found by its heading. */
export async function section15(page: Page, heading: string) {
  const h = onScreen(page.getByText(heading, { exact: true })).first();
  await expect(h).toBeVisible({ timeout: 30_000 });
  const card = h.locator('xpath=ancestor::div[contains(@class,"rounded")][1]');
  await expect(card).toBeVisible();
  return card;
}

/** One sub-tab of the Presentation tab: Website or Slideshow. */
export async function presentationSubTab(page: Page, name: 'Website' | 'Slideshow') {
  const b = onScreen(page.getByRole('button', { name, exact: true })).first();
  await b.click();
  return b;
}

/** One sub-tab of the Participants tab: Teams, Players or Referees. */
export async function participantsSubTab(page: Page, name: 'Teams' | 'Players' | 'Referees') {
  const b = onScreen(page.getByRole('button', { name, exact: true })).first();
  await b.click();
  return b;
}

/**
 * One fixture card on the Results tab, found by a team on it.
 *
 * A card's controls depend entirely on its status: Scheduled has START and no
 * score boxes, Live has END and two empty boxes, Ended has neither button. So
 * this only finds the card - the caller asserts the state it expects.
 */
export async function resultsCard(page: Page, home: string, away: string) {
  // Named by BOTH teams. One team plays three fixtures in a four-team group, and
  // its name also appears in the standings table above them, so neither a bare
  // getByText nor one team name finds a single card.
  const card = page.locator('div[class*="rounded-[10px]"]')
    .filter({ hasText: home })
    .filter({ hasText: away })
    .first();
  await expect(card).toBeVisible({ timeout: 30_000 });
  return card;
}

/** The two score boxes on a Live or Ended fixture card, home first. */
export function scoreBoxes(card: Locator) {
  return card.locator('input[type="text"]');
}

/**
 * Put a group's fixtures back to Scheduled with no score.
 *
 * 15.8 starts a fixture, scores it and ends it, which is the only way to
 * photograph the three states a card has. Nothing undoes that directly -
 * `POST /matches/:id/status {"status":"Scheduled"}` answers
 * `400 "Cannot update status of a Finished match"` - so the group is regenerated
 * instead, by nudging its team count and putting it straight back. Verified to
 * come back with the same teams, pairings, order and kick-off times, and every
 * card Scheduled.
 *
 * The same reset lives in `scripts/seed-15.mjs`. It is here as well because a
 * spec that mutates its fixture must put it back itself, rather than leaving the
 * next seed run to notice.
 */
export async function resetGroupFixtures(token: string, tournamentId: string) {
  const detail = (await asUser(token, `/tournaments/${tournamentId}`)).body.data;
  for (const g of detail.groups ?? []) {
    const want = g.teamCount;
    await asUser(token, `/tournament-groups/${g.id}`, { method: 'PUT', body: { teamCount: want + 1 } });
    await asUser(token, `/tournament-groups/${g.id}`, { method: 'PUT', body: { teamCount: want } });
  }
}

/**
 * Post one message into a tournament chat, but only if it is not already there.
 *
 * Chat has no REST surface at all - it is Firestore, the same as the match feed
 * (collection 10, 10.10) - so a chat fixture cannot be seeded over the API and
 * has to be typed. Being idempotent is what stops the transcript growing by one
 * copy of the same line on every run.
 */
export async function ensureChatMessage(page: Page, text: string) {
  // Matched on a PREFIX, not the whole string. A message past about 200
  // characters is truncated in the transcript with a "Read more" control - for
  // everybody, Pro included - so an exact match on a long message never finds the
  // copy that is already there, and the spec posts a second one on every run.
  const marker = text.slice(0, 60);
  const existing = page.getByText(marker);
  if (await existing.count()) {
    await expect(existing.first()).toBeVisible();
    return;
  }
  await page.getByPlaceholder('Write a message...').fill(text);
  await page.keyboard.press('Enter');
  await expect(page.getByText(marker).first()).toBeVisible({ timeout: 30_000 });
}

/**
 * Every timestamp in a chat transcript. Masked: they move on every run.
 *
 * NOT scoped to `main`. The public tournament page has no `<main>` element at
 * all, so the first version of this masked nothing there and 15.7's
 * announcement-only capture came back with three live clock times in it. Only
 * ever used on a chat capture, where the sole `h:mm` strings on the page are the
 * transcript's own.
 */
export function chatTimes(page: Page) {
  return page.getByText(/^\d{1,2}:\d{2}$/);
}

/**
 * Wait for a tournament chat to have loaded its transcript.
 *
 * The conversation header paints before Firestore has answered, so the header is
 * not a gate. "Group conversation" plus the system line that opens every
 * transcript is.
 */
export async function chatReady(page: Page) {
  await expect(onScreen(page.getByText('Group conversation', { exact: true })).first())
    .toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/created the group/).first()).toBeVisible({ timeout: 30_000 });
}

/**
 * Open the fullscreen public slide show with no session, the way a venue screen
 * would.
 *
 * `setFixedTime`, not `install`. The show renders a live wall clock and advances
 * itself every `durationSeconds`, and those two want opposite things:
 *
 * - `clock.install()` plus `runFor()` moves the displayed clock but does NOT
 *   advance the slides - measured over 41 seconds of fake time, the show stayed
 *   on slide 1. Whatever drives the advance is not a timer the clock API
 *   intercepts.
 * - `setFixedTime` pins the displayed clock at one value and leaves the advance
 *   running on the real one.
 *
 * So the clock in the capture is deterministic, the slides still turn, and a
 * spec that wants slide 2 waits for slide 2 to be on screen - a condition, not a
 * duration.
 */
export async function openSlideshow(page: Page, tournamentId: string) {
  await page.clock.setFixedTime(FROZEN_NOW_15);
  await page.goto(`/tournament/${tournamentId}/slideshow`);
  await expect(page.getByText('Powered by Scoryboard', { exact: true })).toBeVisible({
    timeout: 30_000,
  });
  await quiet(page);
}

/**
 * Wait for the slide carrying `marker` to come round.
 *
 * The show turns its own slides, so this is the only way to reach the second
 * one. A generous timeout, because the wait is for however long the slides
 * before it are set to - one whole cycle of the seeded show is 60 seconds.
 */
export async function slideOnScreen(page: Page, marker: Locator) {
  // Both conditions at once, and polled together.
  //
  // A slide's own heading paints before its content: 15.5's group-table capture
  // came back as a standings table beside three grey skeletons, because the
  // marker was on screen a good second before the fixtures were. Waiting for the
  // skeletons separately is not enough either - the show turns itself, so by the
  // time they are gone the slide may have moved on. This waits for a frame in
  // which the slide is up AND nothing on the page is still loading.
  await expect
    .poll(async () => (await marker.isVisible())
      && (await page.locator('.animate-pulse').count()) === 0,
    { timeout: 90_000, intervals: [400] })
    .toBe(true);
  await imagesPainted(page);
}

/**
 * The live wall clock on the slide show. Masked in every capture.
 *
 * `setFixedTime` pins it, so it is stable within one run - but it is pinned to a
 * value the reader has no reason to see, and a future run with a different
 * FROZEN_NOW_15 would change it. Mask it.
 */
export function slideshowClock(page: Page) {
  return page.getByText(/^\d{1,2}:\d{2}:\d{2}$/).first();
}

/**
 * Put a tournament's info page back to empty and all six public tabs back on.
 *
 * 15.3 types a description and uploads two files, and there is no undo control
 * for either. `PUT /tournaments/:id {presentation}` carries the whole object, so
 * writing empty lists is the reset - the uploaded files stay on the server,
 * orphaned and unreferenced, which is the same thing that happens when a reader
 * removes one through the app.
 *
 * The slide shows are read first and written back untouched, because the same PUT
 * carries them and omitting them would wipe them.
 */
export async function resetInfoPage(token: string, tournamentId: string) {
  const cur = (await asUser(token, `/tournaments/${tournamentId}`)).body.data;
  return asUser(token, `/tournaments/${tournamentId}`, {
    method: 'PUT',
    body: {
      presentation: {
        website: {
          visiblePublicTabs: ['info', 'participants', 'standings', 'leaderboard', 'matches', 'chat'],
          infoBody: '',
          attachments: [],
          gallery: [],
        },
        slideshows: cur.presentation?.slideshows ?? [],
      },
    },
  });
}

/**
 * Sign a persona in and land on a PUBLIC tournament page.
 *
 * `signInAs` proves the session by finding the sidebar's Tournament link, and the
 * public page at `/tournament/:id/<tab>` has no sidebar even when the visitor is
 * signed in - so that assertion fails there. This lands on the tournament list
 * first, where the sidebar does exist, and only then goes where it was asked.
 */
export async function signInThenPublic(page: Page, email: string, to: string) {
  await signInAs(page, email, '/tournaments');
  await page.goto(to);
}

/**
 * Wait for a public tournament tab to have finished loading.
 *
 * A tab click swaps the panel immediately and the fetch lands afterwards, so the
 * tab's own label is never a safe gate: 15.1's first pass photographed the
 * Matches tab as a column of grey skeletons and the Standings table as eight
 * columns of zeros, both of which docs/style-guide.md forbids outright.
 *
 * Two gates, and both are needed:
 *   - the skeletons are gone (`.animate-pulse`), which covers the fixture cards;
 *   - `mustContain` is on the page, which covers a table that renders its own
 *     shape with zeros in it before the numbers arrive. Pass something only the
 *     loaded panel can say - a real scoreline, not a heading.
 */
export async function publicSettled(page: Page, mustContain: RegExp) {
  await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 30_000 });
  // useInnerText, because toContainText reads textContent by default and that
  // runs every cell of a table together - "KB 15 Reds33102323-1" - so a pattern
  // with any whitespace in it can never match.
  await expect(page.locator('body')).toContainText(mustContain, {
    timeout: 30_000, useInnerText: true,
  });
  await imagesPainted(page);
}

// --- collection 17: collecting & making payments -----------------------------
//
// REAL MONEY in production, Stripe TEST MODE here. Two rules govern every helper
// below, and both come from briefs/17.md:
//
//   1. **No capture crosses into Stripe.** The onboarding opens a window at
//      connect.stripe.com and Pay Now swaps the dialog for Stripe Elements.
//      Specs photograph the Scoryboard screen that leads in, and stop.
//   2. **Nothing is submitted that cannot be undone.** A payment request cannot
//      be deleted - DELETE sets it Cancelled and the row stays for ever - so no
//      spec sends one, and no spec cancels one. The seed supplies both states.

// @ts-ignore - plain JS module, no types
import * as F17 from './fixtures-17.mjs';

export const KB17 = F17.ACCOUNTS as Record<'pro' | 'player' | 'admin' | 'nopayout', string>;
export const KB17_TEAMS = F17.TEAMS as Record<'united' | 'rovers', string>;
export const KB17_LEADERBOARD: string = F17.LEADERBOARD;
export const KB17_REQUESTS = F17.REQUESTS as Record<
  'tracked' | 'scratch' | 'payable' | 'cancelled',
  { title: string; description: string; basePrice: number; feeAllocation: string }
>;
export const feeBreakdown = F17.feeBreakdown as (base: number) => {
  basePrice: number; total: number; fee: number;
};

/**
 * The clock every collection 17 spec freezes to.
 *
 * Not only for the due-date picker's Today marker. The app decides whether a
 * request is overdue in the browser - `dueDate <= now` - and an overdue request
 * has **Add participants** and **Edit** disabled. The fixtures are due
 * 30 September 2026, so without this freeze 17.6's captures would change
 * behaviour on their own the day that date passes.
 */
export const FROZEN_NOW_17 = new Date(F17.FROZEN_NOW);

export async function freezeClock17(page: Page) {
  await page.clock.setFixedTime(FROZEN_NOW_17);
}

/**
 * Sign in, and open /teams before anything else.
 *
 * This is not tidiness, it is a precondition. **Select Team and Select
 * Leaderboard read a persisted Redux slice that only `/teams` fills**, so an
 * owner of two teams who goes straight to /payment sees "Your Teams (0) / No
 * teams found where you are the owner." Same cause as the External badge in
 * config/api.md. Observed 2026-09-01; it is a real defect and 17.3 documents it,
 * which is why 17.3 has its own signInBare-style path for that one capture.
 */
export async function signIn17(page: Page, email: string, to = '/payment') {
  await signInAs(page, email, '/teams');
  // Gate on the page itself, not on a named team: three of the four personas do
  // not own KB 17 United, and what matters is only that the /teams fetch landed
  // and filled the slice.
  await expect(page.getByText('Manage Teams', { exact: true }).locator('visible=true').first())
    .toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 30_000 });
  await page.goto(to);
}

/** Everything that must be off-screen before a payment capture. */
export async function quiet17(page: Page) {
  await quiet(page);
  await page.addStyleTag({
    content: `
      /* Stripe's helper frames float over the page and change between runs. */
      iframe[name^="__privateStripe"], iframe[src*="js.stripe.com"],
      iframe[src*="connect-js.stripe.com"], iframe[src*="m.stripe.network"],
      iframe[src*="hcaptcha"], #stripeDataLayerFrame {
        display: none !important;
      }
      /* The unread badge on the bell. docs/style-guide.md says mask notification
         counts, and this one moves on its own: seeding a request notifies both
         participants, so it climbs every time the seed runs. A stylesheet rather
         than a mask, because a painted block over the bell reads as a defect. */
      div[class*="bg-red-500"][class*="rounded-full"][class*="absolute"] {
        visibility: hidden !important;
      }
      /* The "Grow Your Team" nudge on a team page. docs/style-guide.md says
         dismiss any in-app promo before capturing; this one sits directly above
         the PAYMENT tab and its copy counts down as the squad fills, so it would
         also change between runs. */
      div[class*="min-h-[88px]"][class*="border-l-[#F97316]"] {
        display: none !important;
      }
    `,
  });
}

/** The Payment hub, loaded. Gate on a row, never on the tab's own label. */
export async function paymentHubReady(page: Page, mustContain: string) {
  await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 30_000 });
  await expect(page.getByText(mustContain, { exact: true }).locator('visible=true').first())
    .toBeVisible({ timeout: 30_000 });
  await imagesPainted(page);
}

/** The REQUESTED / PAY tabs on the hub. */
export async function paymentTab(page: Page, label: 'Requested' | 'Pay') {
  const tab = page.getByRole('tab', { name: label, exact: true });
  await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 30_000 });
}

/**
 * One row in the requests or pays table.
 *
 * Every row is rendered twice - a `hidden xl:grid` wide layout and an `xl:hidden`
 * narrow one - and both are in the DOM. A plain getByText therefore matches two
 * nodes and `.first()` can pick the invisible one, which is a 30-second timeout
 * rather than a failure. `visible=true` is the only safe way in.
 */
export function requestRow(page: Page, title: string) {
  return page.getByText(title, { exact: true }).locator('visible=true').first();
}

/** Open one request's Payment Details window. */
export async function openRequest(page: Page, title: string) {
  await requestRow(page, title).click();
  const dialog = page.getByRole('dialog').filter({ hasText: title }).first();
  await expect(dialog).toBeVisible();
  await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 30_000 });
  return dialog;
}

/** The Request Payment window, and its three sources. */
export async function openSourceChooser(page: Page) {
  // The button is on screen before the page is ready for it, and a click that
  // lands too early is swallowed - no dialog, no error. That cost 17.1 a flaky
  // run and the 17.5 diagnostic a whole pass. Wait for the screen to settle, then
  // click, and give the click one retry.
  await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 30_000 });
  const button = page.getByRole('button', { name: 'Request Payment', exact: true }).first();
  await expect(button).toBeEnabled();
  const dialog = page.getByRole('dialog').filter({ hasText: 'Choose players from your' }).first();
  await button.click();
  try {
    await expect(dialog).toBeVisible({ timeout: 10_000 });
  } catch {
    await button.click();
    await expect(dialog).toBeVisible({ timeout: 20_000 });
  }
  return dialog;
}

export const SOURCE = {
  leaderboards: 'Leaderboards Pick players from your leaderboard list',
  teams: 'Teams Choose players from your team rosters',
  friends: 'Friends Select players from your friends list',
} as const;

export async function chooseSource(page: Page, which: keyof typeof SOURCE) {
  await page.getByRole('button', { name: SOURCE[which], exact: true }).click();
}

/**
 * Walk from the hub to the Payment Request form.
 *
 * Stops at the filled form. **It never presses Send** - a sent request cannot be
 * deleted, so a spec that submitted would add a row on every run and change what
 * 17.7 photographs (docs/style-guide.md, "Actions you can only do once").
 */
export async function openRequestForm(page: Page, team: string = KB17_TEAMS.united) {
  await openSourceChooser(page);
  await chooseSource(page, 'teams');
  await expect(page.getByRole('heading', { name: 'Select Team' })).toBeVisible();
  await page.getByText(team, { exact: true }).locator('visible=true').first().click();
  await expect(page.getByRole('heading', { name: 'Select Players' })).toBeVisible();
  await page.getByRole('button', { name: 'Select all', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  const form = page.getByRole('dialog').filter({ hasText: 'Payment Request' }).first();
  await expect(form).toBeVisible();
  return form;
}

export function formField(page: Page, placeholder: string) {
  return page.locator(`[placeholder="${placeholder}"]`).locator('visible=true').first();
}

/** The fee toggle. Pressed means the payer carries the fee. */
export function feeToggle(page: Page) {
  return page.getByRole('button', { name: 'Pass fee to users', exact: true });
}

/** The sidebar identity block, masked in most captures. */
export function sidebarIdentity17(page: Page, name: string) {
  return page.getByText(name, { exact: true }).locator('visible=true').first();
}

/**
 * Look collection 17's fixtures up by name, and carry the ids the specs need.
 *
 * Never hardcode an id. The seed renames born teams rather than creating them,
 * and a hardcoded id would point at whatever the account happened to hold the
 * day the spec was written.
 *
 * It also asserts the payout account is live, because that is the precondition
 * every article from 17.3 onwards depends on and the failure without it is a
 * bare 500 from POST /payments that reads like an app bug.
 */
export async function fixtures17() {
  const session = await mintSession(KB17.pro);
  const token: string = session.idToken;

  const teams = (await asUser(token, '/teams?all=true')).body.data ?? [];
  const teamByName = (name: string) => {
    const row = teams.find((t: any) => t.name === name);
    if (!row) throw new Error(`Fixture team "${name}" is missing. Run: node scripts/seed-17.mjs`);
    return String(row.teamId);
  };

  const boards = (await asUser(token, '/leaderboards')).body.data ?? [];
  const board = boards.find((b: any) => b.name === KB17_LEADERBOARD);
  if (!board) throw new Error(`"${KB17_LEADERBOARD}" is missing. Run: node scripts/seed-17.mjs`);

  const requests = (await asUser(token, '/payments/my/requests?limit=50&skip=0'))
    .body?.data?.result ?? [];
  const requestByTitle = (title: string) => {
    const row = requests.find((r: any) => r.title === title);
    if (!row) throw new Error(`Fixture request "${title}" is missing. Run: node scripts/seed-17.mjs`);
    return String(row.id ?? row._id);
  };

  const payout = (await asUser(token, '/payments/stripe/account/status')).body?.data ?? null;
  if (!payout?.chargesEnabled) {
    throw new Error(
      `${KB17.pro} has no live payout account (${payout ? payout.onboardingStatus : 'none'}). `
      + 'Every article from 17.3 on needs one, and it cannot be seeded: Stripe\'s '
      + 'signup is CAPTCHA-gated and a human has to complete it. See briefs/17.md, '
      + '"The payout account".',
    );
  }

  // The calendar's own endpoint is the only listing that carries Incomplete rows
  // and the only one that takes a date window (config/api.md). The seed builds
  // exactly one Scheduled match, so take the first.
  const me = (await asUser(token, '/users/me')).body.data;
  const rows = (await asUser(
    token,
    `/players/${me.playerId}/matches?includeIncomplete=true&startDate=2026-01-01&endDate=2028-12-31`,
  )).body?.data?.result ?? [];
  const match = (Array.isArray(rows) ? rows : []).find((m: any) => m.status === 'Scheduled');
  if (!match) throw new Error('No Scheduled fixture match. Run: node scripts/seed-17.mjs');

  return {
    match: String(match.id),
    token,
    email: KB17.pro,
    united: teamByName(KB17_TEAMS.united),
    rovers: teamByName(KB17_TEAMS.rovers),
    leaderboard: String(board.id),
    tracked: requestByTitle(KB17_REQUESTS.tracked.title),
    scratch: requestByTitle(KB17_REQUESTS.scratch.title),
    payable: requestByTitle(KB17_REQUESTS.payable.title),
    cancelled: requestByTitle(KB17_REQUESTS.cancelled.title),
    payout,
  };
}

/**
 * A fresh context signed in as one collection 17 persona.
 *
 * Every persona gets its own context, and that is not a nicety. Signing a second
 * account in on the same page leaves the first one's **persisted Redux store**
 * behind - the same store that decides whether Select Team can see your teams and
 * whether a team reads as External. 17.1's first run signed Nils in, then Mo, and
 * Mo's Teams page never rendered because the store still held Nils's.
 *
 * Caller closes it.
 */
export async function context17(browser: Browser, email: string, to = '/payment') {
  const ctx = await browser.newContext({
    baseURL: process.env.SCORYBOARD_APP_BASE,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    timezoneId: 'Europe/London',
    locale: 'en-GB',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await ctx.newPage();
  await signIn17(page, email, to);
  await freezeClock17(page);
  await quiet17(page);
  return { ctx, page };
}

/**
 * Wait for whatever is in the open dialog to have finished loading.
 *
 * Select Friends fetches its list after the window is already on screen, so the
 * heading is never a safe gate - 17.3 photographed six skeleton rows on its first
 * run and shot()'s backstop threw. Gate on the skeletons being gone and on a row
 * that only the loaded list can have.
 */
export async function dialogSettled(page: Page, mustContain?: string) {
  await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 30_000 });
  if (mustContain) {
    await expect(page.getByText(mustContain, { exact: true }).locator('visible=true').first())
      .toBeVisible({ timeout: 30_000 });
  }
  await imagesPainted(page);
}

/**
 * The fee block in the Payment Request form - the toggle and, when the payer is
 * carrying it, the breakdown underneath.
 *
 * It is BELOW THE FOLD of the dialog's own scroller (565px tall, block at y=673),
 * so a capture clipped to the whole dialog loses it entirely. 17.5's first run
 * published a form with no figures on it for exactly that reason. Clip to this
 * instead, and let locator.screenshot() scroll it into view.
 */
export function feeBlock(page: Page) {
  return feeToggle(page).locator('xpath=ancestor::div[2]');
}

/** The You will receive / Transaction fee / Total price rows. Only when passed on. */
export function feeBreakdownBlock(page: Page) {
  return page.getByText('Transaction fee', { exact: true }).locator('xpath=ancestor::div[2]');
}

/**
 * The per-person rows inside a Payment Details window.
 *
 * The SMALLEST block holding both people, deliberately. The window scrolls
 * internally and the rows sit below its fold, so clipping to the dialog - or to
 * anything that also contains the heading above them - captures the top of the
 * window and no rows at all. 17.6 published exactly that on its first pass.
 */
export function participantRows(details: Locator) {
  return details.locator('div')
    .filter({ hasText: 'Ada KB' })
    .filter({ hasText: 'Pia KB' })
    .last();
}

// ---------------------------------------------------------------------------
// Collection 18 - Chat & messaging
// ---------------------------------------------------------------------------
//
// The whole collection lives on one route, `/chat`, and on one shape: a three
// column page whose middle column is the conversation list and whose right hand
// column is the open transcript.
//
// Two things about this page decide how every helper below is written.
//
// **It opens a conversation by itself.** Landing on /chat selects the most
// recent conversation, which is whichever one the seed wrote last. So a spec
// always clicks the conversation it wants; it never assumes the one on screen.
//
// **Nothing here has an id a spec may hold.** `scripts/seed-18.mjs` deletes and
// rebuilds every conversation on each run, so conversation ids and message ids
// change between runs. Every helper below takes text - a title, a message - and
// never an id. The one exception is 18.2's teardown, which deletes a
// conversation the SPEC created moments earlier and therefore knows the id of.

// @ts-ignore - plain JS module, no types
import * as F18 from './fixtures-18.mjs';

export const KB18 = F18.ACCOUNTS as Record<'pro' | 'free' | 'member' | 'outsider' | 'empty', string>;
export const KB18_PROFILES = F18.PROFILES as Record<string, { name: string; lastName: string; membership: string }>;
export const KB18_TEAMS = F18.TEAMS as Record<'chat' | 'chatAway' | 'free', string>;
export const KB18_LEADERBOARD: string = F18.LEADERBOARD;
export const KB18_GROUP = F18.GROUP as { title: string; admin: string; members: string[] };
export const KB18_TRANSCRIPT = F18.GROUP_TRANSCRIPT as {
  key: string; from: string; text: string; replyTo?: string;
  editedFrom?: string; deleteForEveryone?: boolean;
}[];
export const KB18_DIRECT_PRO = F18.DIRECT_PRO_TRANSCRIPT as { from: string; text: string }[];
export const KB18_DIRECT_FREE = F18.DIRECT_FREE_TRANSCRIPT as { from: string; text: string }[];
export const KB18_SPEC_GROUP = F18.SPEC_GROUP as { title: string; members: string[] };
export const KB18_REACTION = F18.REACTION as { on: string; by: string; emoji: string };
export const KB18_REPORT_REASONS: string[] = F18.REPORT_REASONS;
export const lockedPreview = F18.lockedPreview as (text: string) => string;

export const FROZEN_NOW_18 = new Date(F18.FROZEN_NOW);

/** One row of the seeded transcript, by its fixture key. */
export function kb18Message(key: string) {
  const row = KB18_TRANSCRIPT.find((m) => m.key === key);
  if (!row) throw new Error(`kb18Message(): no transcript row keyed "${key}"`);
  return row;
}

/**
 * Freeze the clock.
 *
 * setFixedTime rather than install, for the reason freezeClock() gives: the
 * Firebase session refreshes on a timer, and installing a fake clock signs the
 * spec out mid-run. Chat needs it for the `today` divider above the transcript
 * and for the relative time on a conversation row.
 *
 * It does NOT freeze the times inside the bubbles. Those come from the server's
 * own `createdAt` at seed time, so they move whenever the seed is re-run, and
 * they are masked instead - see chat18Times().
 */
export async function freezeClock18(page: Page) {
  await page.clock.setFixedTime(FROZEN_NOW_18);
}

// --- Transcript timestamps are NOT masked, and that is a decision ----------
//
// There was a chat18Times() here, matching every `h:mm` node the way collection
// 15 masks the tournament chat's. It was removed after looking at what it
// produced, and this note is here so the next session does not add it back
// without reading the same screenshot.
//
// docs/style-guide.md says to mask "absolute dates and times that are not the
// point of the screenshot". A tournament chat has three or four times on screen.
// A collection 18 capture has twelve to fourteen - one under every bubble, one
// on every conversation row - and a mask over all of them turns the transcript
// into a column of black rectangles. The same guide says to write for "someone
// who is stuck, on their phone, at a pitch, in the rain", and forbids masking
// the thing the article is about. A timestamp under a message is part of what a
// chat message looks like; the article is a tour of that.
//
// Two further reasons, both specific to this collection:
//
//   - The times are not identifying and not absolute. They are `h:mm` on the
//     day the seed ran, with no date beside them.
//   - The app renders an edited message's footer as ONE node, `8:21 · edited`.
//     Any regex loose enough to catch the time also paints over the word that
//     18.3's last capture exists to show, and a regex tight enough to spare it
//     leaves exactly one legible time among a dozen blocks - which reads worse
//     than leaving all of them.
//
// The times move whenever `scripts/seed-18.mjs` is re-run. docs/workflow.md
// allows that: "Two runs may differ slightly and still be correct."
//
// What IS still hidden: the signed-in name (sidebarIdentity18) and every unread
// badge (quiet18).

/** The signed-in name in the sidebar. Masked in every full-page capture. */
export function sidebarIdentity18(page: Page, name: string) {
  return page.getByText(name, { exact: true }).locator('visible=true').first();
}

/** Everything that must be off-screen before a chat capture. */
export async function quiet18(page: Page) {
  await quiet(page);
  await page.addStyleTag({
    content: `
      /* The three unread counts: the bell's badge, the sidebar's Chat badge and
         the blue pill on a conversation row. docs/style-guide.md says mask
         notification badges, and all three move on their own - seeding a
         transcript leaves every other account with unread messages, so they
         climb on every re-seed. Hidden rather than masked: a painted block on a
         nav item reads as a defect rather than as redaction.

         Each selector is pinned to that badge and nothing else. A first draft
         matched bg-red-* and rounded-full broadly and took the PRESENCE DOT
         off every avatar with it - the 12px border-2 border-white bg-red-500
         marker that says somebody is offline. That is ordinary UI, it is in
         every capture in this collection, and hiding it was invisible until two
         screenshots were compared side by side. */
      div[class*="-top-2"][class*="-right-2"][class*="bg-red-500"],
      span[class*="pointer-events-none"][class*="right-3"][class*="bg-red-500"],
      span[class*="bg-blue-600"][class*="tabular-nums"] {
        visibility: hidden !important;
      }
    `,
  });
}

/**
 * A browser context of its own, signed in, with the chat page open.
 *
 * One context per persona, closed before the next opens. Two reasons, and the
 * second is particular to chat:
 *
 *   - The app persists a Redux store per origin, so signing a second account in
 *     on the same page leaves the first one's state behind. Collection 17 hit
 *     that on its Teams page - see context17.
 *   - **Presence is live.** The app writes to /online/users/:uid over the
 *     Realtime Database and paints a green dot on anybody signed in. Two open
 *     contexts therefore put a green dot on an avatar that is red in every other
 *     capture, and nothing in the spec would explain the difference.
 *
 * Caller closes it.
 */
export async function context18(browser: Browser, email: string) {
  const ctx = await browser.newContext({
    baseURL: process.env.SCORYBOARD_APP_BASE,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    timezoneId: 'Europe/London',
    locale: 'en-GB',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await ctx.newPage();
  await signInAs(page, email, '/chat');
  await freezeClock18(page);
  await expect(page.getByRole('button', { name: 'Start a new chat' })).toBeVisible({ timeout: 30_000 });
  await quiet18(page);
  return { ctx, page };
}

/**
 * Open one conversation from the Chats list, and wait for its transcript.
 *
 * `mustContain` is a message only the loaded transcript has. The header paints
 * from the conversation row the moment it is clicked, so the header is never a
 * safe gate - collection 15 learned the same on the tournament chat, see
 * chatReady().
 */
export async function openConversation(page: Page, title: string, mustContain: string) {
  await page.getByText(title, { exact: true }).locator('visible=true').first().click();
  await expect(page.getByText(mustContain, { exact: true }).locator('visible=true').first())
    .toBeVisible({ timeout: 30_000 });
  await transcriptSettled(page);
}

/**
 * Wait for the transcript to stop fetching.
 *
 * Two gates, and the second one is not covered by shot()'s skeleton backstop.
 *
 * The transcript paginates on scroll, and it puts a **"Loading older
 * messages..."** pill at the top of the column while it does. That is a loading
 * indicator, which docs/style-guide.md forbids in a capture - and it is a plain
 * text pill, not an `.animate-pulse`, so nothing in shot() catches it. 18.3's
 * shot 09 published one: two earlier clipped captures had scrolled the column up
 * far enough to trigger the fetch, on a group with no older messages to fetch.
 *
 * Call this before any capture that shows the transcript, and after anything
 * that scrolls it.
 */
export async function transcriptSettled(page: Page) {
  await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 30_000 });
  await expect(page.getByText('Loading older messages...')).toHaveCount(0, { timeout: 30_000 });
  await imagesPainted(page);
}

/**
 * One row in the Chats list, with its avatar, title, tag, preview and time.
 *
 * The row, not the column. The column is an `<aside>` 899 pixels tall with two
 * rows at the top of it and white space for the rest, so a capture clipped to it
 * is nine tenths empty - which is what 18.1's first run published.
 */
export function conversationRow(page: Page, title: string) {
  return page.getByText(title, { exact: true }).locator('visible=true').first()
    .locator('xpath=ancestor::div[contains(@class,"border-b")][1]');
}

/**
 * The open conversation - header, transcript and message box - without the
 * sidebar or the Chats list.
 *
 * For the one capture that has to hold two bubbles at once. The transcript is a
 * column of rows with no wrapper around any two of them, and its own messages
 * sit on the right while everybody else's sit on the left, so a padded clip
 * around one bubble can never reach the other: 18.3's shot 09 first came back
 * showing the deleted message and 400 pixels of empty background where the
 * edited one was meant to be.
 */
export function transcriptColumn(page: Page) {
  return page.locator('section')
    .filter({ has: page.getByPlaceholder('Write a message...') })
    .first();
}

/**
 * The bubble holding one message. The chevron and the reaction pill live on it.
 *
 * **A bubble whose menu has been opened keeps its chevron for good.** Not while
 * hovered, and not while focused - for good: parking the pointer does not clear
 * it and neither does blurring the trigger. So a capture of a message AT REST
 * has to be taken before any menu is opened on that bubble, which is why 18.3
 * captures out of order. There is no way to put a bubble back once it has been
 * opened, short of reloading the page.
 */
export function bubble18(page: Page, text: string) {
  return page.getByText(text, { exact: true }).locator('visible=true').first()
    .locator('xpath=ancestor::div[contains(@class,"rounded")][1]');
}

/**
 * Open the chevron menu on one message.
 *
 * The trigger only paints on hover, so the hover is part of opening it rather
 * than a nicety. Returns the bubble, because most of these captures clip to it.
 */
export async function openMessageMenu(page: Page, text: string) {
  const b = bubble18(page, text);
  await b.scrollIntoViewIfNeeded();
  await b.hover();
  const trigger = b.getByRole('button', { name: 'Open message actions' });
  await expect(trigger).toBeVisible({ timeout: 15_000 });
  await trigger.click();
  await expect(page.getByRole('menuitem', { name: 'Copy', exact: true })).toBeVisible({ timeout: 15_000 });
  return b;
}

/** Close whatever menu is open, and prove it closed. */
export async function closeMessageMenu(page: Page) {
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menuitem', { name: 'Copy', exact: true })).toBeHidden({ timeout: 15_000 });
}

/** The conversation header. It is also the button that opens Group Info. */
export function conversationHeader(page: Page, title: string) {
  return page.getByRole('button', { name: new RegExp(`${title}\\s+(Group conversation|Direct message)`) });
}

/**
 * Open Group Info.
 *
 * There is no gear and no menu: the header itself is the control, and it carries
 * no label of its own beyond the group name and the subtitle. Worth knowing
 * before writing 18.2's step 6.
 */
export async function openGroupInfo(page: Page, title: string) {
  await conversationHeader(page, title).click();
  await expect(page.getByRole('heading', { name: 'Group Info' })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 30_000 });
  await imagesPainted(page);
  return groupInfoPanel(page);
}

/** The Group Info window itself, for clipping. */
export function groupInfoPanel(page: Page) {
  return panelFor(page, 'Group Info');
}

/**
 * The smallest block holding a floating window's heading and its controls.
 *
 * Every dialog in this collection - the New Chat wizard, Group Info, the four
 * confirms, Forward Message, Report message - is portalled and carries no role
 * of its own. There is nothing to ask for with getByRole('dialog'), so the
 * heading's nearest rounded ancestor is the window.
 *
 * `.last()`, not `.first()`: a confirm opens ON TOP of the window that raised
 * it, and the heading of the one underneath can still be in the DOM.
 */
export function panelFor(page: Page, heading: string) {
  // The shared modal shell, matched on the three classes every one of them
  // carries: relative, z-50 and shadow-lg. The dimmed overlay behind it is also
  // z-50 but has no shadow.
  //
  // NOT the heading's nearest rounded ancestor. That was the first version and
  // it resolved to the dialog's HEADER strip - the one with rounded-t-2xl - so
  // 18.2's first capture was a 384x137 crop of a title and nothing else, with
  // its annotation drawn outside the frame. Nor is `rounded-lg` in the selector:
  // the wizard's shell has it and Group Info's does not.
  //
  // Two shells, because Forward Message is not built from the shared modal. It
  // is an overlay rendered inside the conversation column with shadow-xl and
  // rounded-2xl, and no z-50 of its own; everything else - the wizard, Group
  // Info, Report message, all four confirms - is the shared one.
  return page
    .locator(
      'div[class*="relative"][class*="z-50"][class*="shadow-lg"],'
      + ' div[class*="shadow-xl"][class*="rounded-2xl"]',
    )
    .filter({ hasText: heading })
    .last();
}

/**
 * Delete a group chat by its title, as the account that admins it.
 *
 * 18.2 creates a group, photographs it and disposes of it. Called at the START
 * of that spec as well as at the end: a run that dies between the create and the
 * teardown would otherwise leave a group behind, and the next run would make a
 * second one with the same name and photograph whichever the list showed first.
 *
 * Silent when there is nothing to delete.
 */
export async function deleteGroupByTitle(token: string, title: string) {
  const list = (await asUser(token, '/chats?limit=50')).body?.data?.conversations ?? [];
  for (const c of list) {
    if (c.type !== 'group' || c.title !== title) continue;
    await asUser(token, `/chats/conversations/${c.id ?? c.conversationId}/group`, { method: 'DELETE' });
  }
}

/** A wizard option row. Matched on its subtitle, which is unique on the page. */
export function wizardOption(page: Page, subtitle: string) {
  return page.getByRole('button').filter({ hasText: subtitle }).first();
}

/**
 * Everything collection 18's specs need from the API, looked up by name.
 *
 * No id is stored anywhere. The seed rebuilds the conversations on every run, so
 * a spec holding one would break the first time the seed was re-run.
 */
export async function fixtures18() {
  const sessions: Record<string, { token: string; uid: string; playerId: string; membership: string }> = {};
  for (const [key, email] of Object.entries(KB18)) {
    const session = await mintSession(email);
    const me = (await asUser(session.idToken, '/users/me')).body?.data;
    if (!me) throw new Error(`${email} has no Scoryboard user. Run: node scripts/seed-18.mjs`);
    sessions[key] = {
      token: session.idToken, uid: me.uid, playerId: me.playerId, membership: me.membership,
    };
    // The whole collection turns on who is Free and who is Pro, so check it here
    // rather than discovering it as a missing "Unlock with Pro" button forty
    // captures later.
    const want = KB18_PROFILES[key].membership;
    if (me.membership !== want) {
      throw new Error(
        `${email} is ${me.membership}, and collection 18 needs it ${want}. `
        + 'Run: node scripts/seed-18.mjs',
      );
    }
  }

  const list = (await asUser(sessions.pro.token, '/chats?limit=50')).body?.data?.conversations ?? [];
  const group = list.find((c: any) => c.type === 'group' && c.title === KB18_GROUP.title);
  if (!group) {
    throw new Error(
      `"${KB18_GROUP.title}" is not on ${KB18.pro}'s conversation list. Run: node scripts/seed-18.mjs`,
    );
  }
  const directPro = list.find((c: any) => c.type === 'direct');
  if (!directPro) throw new Error(`No direct conversation for ${KB18.pro}. Run: node scripts/seed-18.mjs`);

  return {
    sessions,
    groupId: group.id ?? group.conversationId,
    directProId: directPro.id ?? directPro.conversationId,
  };
}

/** One message id in a conversation, looked up by its text. */
export async function messageId18(token: string, conversationId: string, text: string) {
  const r = await asUser(token, `/chats/conversations/${conversationId}/messages?limit=50`);
  const rows = r.body?.data?.messages ?? [];
  const hit = rows.find((m: any) => m.text === text);
  if (!hit) {
    throw new Error(
      `No message reading "${text}" in ${conversationId}. Found: `
      + rows.map((m: any) => JSON.stringify(m.text)).join(', '),
    );
  }
  return hit.id as string;
}

// --- collection 19: comments, likes & ratings --------------------------------
//
// Read the header of lib/fixtures-19.mjs first. The short version, because it
// shapes every selector below:
//
//   - Comments live on exactly two screens, the **team page** and the
//     **leaderboard page**. Both render the same panel below every tab.
//   - A comment row is a `<div id="<commentId>">` holding three controls, in
//     this order and with no accessible names on two of them: **Reply**, a
//     thumbs-up carrying the like count, and a speech bubble carrying the reply
//     count.
//   - Ratings live in one place, the **Rate** button on a Finished match.
//
// Collection 08 photographed the same panel on a leaderboard and its helpers
// are reused rather than copied: commentBox(), commentsPanel(), commentTimes()
// and parkPointer() are all its work, and settled08()'s spinner gate is the one
// that stops a capture landing while "View n more replies" is still fetching.
//
// @ts-ignore - plain JS module, no types
import * as F19 from './fixtures-19.mjs';

export const KB19 = F19.ACCOUNTS as Record<string, string>;
export const KB19_TEAMS = F19.TEAMS as { home: string; away: string };
export const KB19_LEADERBOARD: string = F19.LEADERBOARD;
export const KB19_NAMES = F19.FULL_NAMES as Record<string, string>;
export const KB19_COMMENTS = F19.COMMENTS as {
  on: string; by: string; text: string; media?: string;
  likes: string[]; replies: { by: string; text: string }[];
}[];
export const KB19_RATINGS = F19.RATINGS as { on: string; by: string; rating: number; comment?: string }[];
export const KB19_AVERAGES = F19.EXPECTED_AVERAGES as Record<string, { averageRating: number; totalCount: number; shown: string }>;
export const FROZEN_NOW_19 = new Date(F19.FROZEN_NOW);

/** One seeded comment, by the text the fixture gives it. */
export function kb19Comment(startsWith: string) {
  const row = KB19_COMMENTS.find((c) => c.text.startsWith(startsWith));
  if (!row) throw new Error(`kb19Comment(): no seeded comment starting "${startsWith}"`);
  return row;
}

/**
 * Everything collection 19's specs need from the API, looked up by NAME.
 *
 * scripts/seed-19.mjs rebuilds the teams, the leaderboard and the match on every
 * run, so their ids change every time. Nothing here may be hardcoded in a spec -
 * that is the mistake that stopped six of collection 12's specs running.
 *
 * Throws with the seed command in the message when a fixture is missing, so a
 * failure says what to do rather than what was undefined.
 */
export async function fixtures19() {
  const sessions: Record<string, { email: string; token: string; id: string; playerId: string; membership: string }> = {};
  for (const [key, email] of Object.entries(KB19)) {
    const s = await mintSession(email);
    const me = (await asUser(s.idToken, '/users/me')).body?.data;
    if (!me) throw new Error(`No Scoryboard user for ${email}. Run: node scripts/seed-19.mjs`);
    sessions[key] = {
      email, token: s.idToken, id: me.id, playerId: me.playerId, membership: me.membership,
    };
  }

  const owner = sessions.owner;
  const teams = (await asUser(owner.token, '/teams?all=true')).body?.data ?? [];
  const pick = (name: string) => {
    const hit = teams.find((t: any) => t.name === name);
    if (!hit) throw new Error(`No team "${name}". Run: node scripts/seed-19.mjs`);
    return hit.teamId as string;
  };
  const homeId = pick(KB19_TEAMS.home);
  const awayId = pick(KB19_TEAMS.away);

  const boards = (await asUser(owner.token, '/leaderboards')).body?.data ?? [];
  const board = boards.find((b: any) => b.name === KB19_LEADERBOARD);
  if (!board) throw new Error(`No leaderboard "${KB19_LEADERBOARD}". Run: node scripts/seed-19.mjs`);

  // The played match is the only Finished one in the board. `result` is the
  // list's own wrapper; a Cancelled match is not in it, which is how an earlier
  // trial match stays out of a spec's way.
  const listed = (await asUser(owner.token, `/leaderboards/${board.id}/matches`)).body?.data;
  const matches = listed?.result ?? listed ?? [];
  const played = matches.find((m: any) => m.status === 'Finished');
  if (!played) {
    throw new Error(
      `No Finished match in "${KB19_LEADERBOARD}" - found ${matches.length} match(es): `
      + `${matches.map((m: any) => m.status).join(', ') || 'none'}. Run: node scripts/seed-19.mjs`,
    );
  }

  return {
    sessions,
    teamId: homeId,
    awayTeamId: awayId,
    leaderboardId: board.id as string,
    matchId: played.id as string,
    playerId: sessions.player.playerId,
    refereePlayerId: sessions.referee.playerId,
  };
}

/**
 * Freeze the clock.
 *
 * setFixedTime rather than install, for the reason freezeClock() gives: Firebase
 * refreshes the session on a timer and a fake clock signs the spec out mid-run.
 *
 * It does NOT freeze the times in a comment footer. Those are the server's
 * `createdAt` at seed time, rendered as an absolute `03:33 PM • Sep 02, 2026`,
 * and they move whenever the seed is re-run - so they are MASKED, unlike
 * collection 18's, which were left alone. The difference is the count and the
 * shape: a chat capture has a dozen bare `h:mm` stamps and painting over all of
 * them turns the transcript into black bars, while a comment panel has two or
 * three and each one carries a full date. docs/style-guide.md: mask "absolute
 * dates and times that are not the point of the screenshot".
 */
export async function freezeClock19(page: Page) {
  await page.clock.setFixedTime(FROZEN_NOW_19);
}

/** Everything that must be off-screen before a collection 19 capture. */
export async function quiet19(page: Page) {
  await quiet(page);
  await page.addStyleTag({
    content: `
      /* The bell's unread badge and the sidebar's Chat badge. Both climb on
         their own - seeding a match and five comments leaves every account with
         notifications - and docs/style-guide.md says mask notification badges.
         Hidden rather than masked: a painted block on a nav item reads as a
         defect rather than as redaction. Pinned to those two badges, never to
         bg-red-* generally: collection 18 found that a loose match takes the
         offline presence dot off every avatar with it. */
      div[class*="-top-2"][class*="-right-2"][class*="bg-red-500"],
      span[class*="pointer-events-none"][class*="right-3"][class*="bg-red-500"] {
        visibility: hidden !important;
      }
    `,
  });
}

/**
 * A browser context of its own, signed in, on `to`.
 *
 * One context per persona, closed before the next opens. The app persists a
 * Redux store per origin, so signing a second account in on the same page leaves
 * the first one's state behind - collection 17 hit that on the Teams page, and
 * collection 08 found that the **External** badge on a team row is computed off
 * that same persisted slice. This collection photographs team rows, so a leaked
 * store would change what the capture shows.
 *
 * Caller closes it.
 */
export async function context19(browser: Browser, email: string, to: string) {
  const ctx = await browser.newContext({
    baseURL: process.env.SCORYBOARD_APP_BASE,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    timezoneId: 'Europe/London',
    locale: 'en-GB',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await ctx.newPage();
  await signInAs(page, email, to);
  await freezeClock19(page);
  await quiet19(page);
  return { ctx, page };
}

/**
 * Wait for the Comments panel to load, and prove what is in it.
 *
 * A thin wrapper over collection 08's commentsPanel(), which already gates on
 * the heading AND on settled08() - the panel counts its comments and then keeps
 * loading, because it fetches what sits behind "View n more replies"
 * separately, and 08.5 published a spinner under a thread before that gate
 * existed. Waiting for the exact count is also an assertion: it fails loudly
 * when scripts/seed-19.mjs has not run, rather than photographing an empty
 * panel.
 */
export async function comments19(page: Page, count: number) {
  const panel = await commentsPanel(page, count);
  await imagesPainted(page);
  return panel;
}

/**
 * The whole Comments panel - composer, heading and every thread.
 *
 * Taken as the heading's nearest ancestor that also holds a textarea, rather
 * than by class: the panel has no wrapper of its own with a stable name.
 */
export function commentsSection(page: Page, count: number) {
  return page.getByText(`Comments (${count})`, { exact: true })
    .locator('xpath=ancestor::div[.//textarea][1]');
}

/**
 * One comment row, by the start of its text.
 *
 * The row is the `<div id="<commentId>">` the app wraps each comment in. That id
 * is a database id and changes on every seed, so it is never written into a
 * spec - this finds the row by what the comment says instead, and narrows to the
 * element that actually holds the controls.
 */
export function commentRow(page: Page, startsWith: string) {
  return page.locator('div[id]')
    .filter({ hasText: startsWith })
    .filter({ has: page.getByRole('button', { name: 'Reply', exact: true }) })
    .last();
}

/**
 * The thumbs-up on a comment row, in either state.
 *
 * The button has no accessible name - its only text is the like count, which
 * moves - so it is found by its icon. **Two paths, because the icon changes
 * with the state**: an outline thumbs-up (`M20 8h-5.612...`) when you have not
 * liked it, a filled one (`M4 21h1V8H4...`) when you have. Matching only one of
 * them finds the button before a like and loses it afterwards.
 */
export function likeButton(row: Locator) {
  return row.locator(
    'button:has(svg path[d^="M20 8h-5.612"]), button:has(svg path[d^="M4 21h1V8H4"])',
  );
}

/** The speech bubble carrying the reply count. Its icon does not change state. */
export function replyCountButton(row: Locator) {
  return row.locator('button:has(svg path[d^="M20 2H4c-1.103"])');
}

/** 'liked' or 'not-liked', read off the icon's colour class. */
export async function likedState(row: Locator): Promise<'liked' | 'not-liked'> {
  const cls = await likeButton(row).locator('svg').first().getAttribute('class');
  return (cls ?? '').includes('text-blue-600') ? 'liked' : 'not-liked';
}

/**
 * The reply composer that opens under a comment when Reply is clicked.
 *
 * It is a SECOND textarea with the SAME placeholder as the panel's own
 * composer, so the placeholder cannot identify it. Its Cancel button can: the
 * top-level composer has none.
 */
export function replyComposer(page: Page) {
  return page.getByRole('button', { name: 'Cancel', exact: true })
    .locator('xpath=ancestor::div[.//textarea][1]');
}

/**
 * The image on a comment that carries an attachment.
 *
 * Not an `<img>`. `GET /comments/:id/media/:filename` needs the bearer token, so
 * the app fetches it itself, makes a `blob:` URL and paints it as a CSS
 * background on a bare div. imagesPainted() covers background images, so the
 * ordinary capture gate still works - but nothing finds this by role or alt.
 */
export function commentAttachment(row: Locator) {
  return row.locator('div[style*="background-image"]');
}

/**
 * Open the Rate dialog on a Finished match and choose one subject.
 *
 * **The pointer is parked afterwards, and that is not tidiness.** The star row
 * lights on hover, and the chooser's rows sit roughly where the stars appear, so
 * the mouse is left resting over one of them the moment the panel opens. A
 * capture taken there shows a rating nobody chose: the first walk through this
 * read three amber stars on an account that had never rated the match. parkPointer() clears
 * `hoveredRating`, and the form then shows its real value - empty on
 * a first rating, your own stars on one you are changing.
 */
export async function openRate(page: Page, subject: 'Match' | 'Player' | 'Team' | 'Referee') {
  await page.getByRole('button', { name: 'Rate', exact: true }).first().click();
  const chooser = page.getByRole('dialog').last();
  await expect(chooser.getByText('What would you like to rate?')).toBeVisible({ timeout: 15_000 });
  await chooser.getByRole('button').filter({ hasText: subject }).first().click();

  const panel = page.getByRole('dialog').last();
  await expect(panel.getByRole('button', { name: /^(Post|Update)$/ })).toBeVisible({ timeout: 15_000 });
  await parkPointer(page);
  await expect(panel.locator('[aria-label="Rate 1 star"]')).toBeVisible();
  await imagesPainted(page);
  return panel;
}

/** The five stars in an open rating panel, as one row, for one annotation. */
export function starRow(panel: Locator) {
  return panel.locator('[aria-label="Rate 1 star"]')
    .locator('xpath=ancestor::div[count(.//button[starts-with(@aria-label,"Rate ")])=5][1]');
}

/**
 * How many stars are lit in an open rating panel.
 *
 * `text-amber-400` on the button, `text-neutral-300` when it is not. Used to
 * assert that a panel opened on the rating the fixture left rather than on a
 * hover.
 */
export async function starsLit(panel: Locator) {
  const classes = await panel.locator('[aria-label^="Rate "]').evaluateAll(
    (els) => els.map((e) => e.getAttribute('class') ?? ''),
  );
  return classes.filter((c) => c.includes('text-amber-400')).length;
}

/**
 * The signed-in name in the sidebar. Masked in every collection 19 capture.
 *
 * The FIRST visible match, and that ordering matters on one page: 19.4's last
 * shot is Pia's own player profile, where "Pia KB" is both the sidebar name and
 * the page's own heading. The sidebar comes first in the DOM, so .first() takes
 * the identity block and leaves the profile heading alone - which is right, both
 * because docs/style-guide.md masks the signed-in identity in the header and
 * because it forbids masking the thing the article is about.
 *
 * Reads the name off the fixture rather than taking an argument, so a spec
 * cannot mask one persona's name while signed in as another.
 */
export function headerIdentity19(page: Page, persona: keyof typeof KB19_NAMES = 'player') {
  return page.getByText(KB19_NAMES[persona], { exact: true }).locator('visible=true').first();
}

/**
 * The header block that carries an average rating and its "N reviews" button.
 *
 * The same shape on a team page and on a player page: a full-width row sitting
 * over the banner, holding the crest or avatar, the name, the average and the
 * counters. Found by `items-end justify-between`, which both carry and nothing
 * else on either page does.
 *
 * Walking up a fixed number of divs works and is not used: the two pages differ
 * by one wrapper, so the count that frames the team header crops the player one
 * mid-name. Walking up to the average's nearest button-bearing ancestor is
 * worse - it lands on the 168x24 box holding the number and the link, and 19.4's
 * first run published a 416x212 crop of two words with no page around them.
 */
export function ratingHeader19(average: Locator) {
  return average.locator(
    'xpath=ancestor::div[contains(@class,"items-end") and contains(@class,"justify-between")][1]',
  );
}

/**
 * The kebab on YOUR OWN row in a reviews list, and the menu it opens.
 *
 * This is the only way to change or remove a rating, and it is easy to miss. The
 * Rate panel offers Post, Update and Close and nothing else; the edit and the
 * delete live here, in the read-only list behind the "N reviews" button, on the
 * one row that is yours. The button has no accessible name and its icon is a
 * plain vertical ellipsis, so `aria-haspopup="menu"` is the handle.
 *
 * `visible=true` is not optional: the page carries other menu triggers that are
 * mounted and hidden, and a bare .first() picks one of those instead - it cost a
 * probe a 30-second timeout on an element that was never going to appear.
 */
export function reviewMenuButton(dialog: Locator) {
  return dialog.locator('[aria-haspopup="menu"]').locator('visible=true').first();
}

/**
 * The match card's kick-off date and clock time, for masking.
 *
 * scripts/seed-19.mjs dates its match 90 seconds before the seed runs - it has
 * to, because events are only accepted while a match is Live and a match is Live
 * only between its date and its date plus its duration. So both of these move on
 * every re-seed, and docs/style-guide.md masks "absolute dates and times that are
 * not the point of the screenshot". 19.3's shot 01 is about where the Rate button
 * is; the kick-off time is not its subject.
 *
 * Two separate patterns rather than one loose one: "Wed, 2 Sept 2026" and
 * "11:59". A regex wide enough to catch both also catches the 60 min duration and
 * the 5 VS 5 beside them, which do NOT move and are ordinary product UI.
 */
export function matchStamp19(page: Page) {
  return [
    page.getByText(/^\w{3},\s\d{1,2}\s\w{3,9}\s\d{4}$/),
    page.getByText(/^\d{1,2}:\d{2}$/),
  ];
}

/**
 * The "N reviews" button that opens the read-only review list.
 *
 * It is a real `<button class="text-blue-400 underline">` and it appears in
 * three places: the match header, a team page header and a player page header.
 * The label is singular at one review, so callers pass the whole string.
 */
export function reviewsButton(page: Page, label: string) {
  return page.getByRole('button', { name: label, exact: true }).locator('visible=true').first();
}
