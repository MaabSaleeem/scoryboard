// Helpers the collection 12 specs share.
//
// Three jobs: sign a persona in, put the page into a state that captures the
// same way every run, and take the screenshot the brief asked for.
//
// Nothing here reads a clock, invents a name, or waits on a duration. If you are
// tempted to add something that does, it belongs in the spec as a seeded fixture
// instead.

import { expect, type Page, type Locator } from '@playwright/test';
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
    const w = window as unknown as { __kbBg?: Map<string, boolean> };
    w.__kbBg ??= new Map();
    let ready = true;
    for (const url of urls) {
      if (url.startsWith('data:')) continue;
      if (!w.__kbBg.has(url)) {
        w.__kbBg.set(url, false);
        const probe = new Image();
        probe.onload = () => w.__kbBg!.set(url, true);
        probe.onerror = () => w.__kbBg!.set(url, true);
        probe.src = url;
      }
      if (!w.__kbBg.get(url)) ready = false;
    }
    return ready;
  }, undefined, { timeout: 20_000 });
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

  if (opts.annotate) await annotate(page, opts.annotate, opts.annotatePad);
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
  } else if (opts.clip) await opts.clip.screenshot(common);
  else await page.screenshot({ ...common, fullPage: opts.fullPage ?? false });
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
  await expect(page.locator('.animate-pulse')).toHaveCount(0);
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
  await expect(page.locator('.animate-pulse')).toHaveCount(0);
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
  await expect(page.locator('.animate-pulse')).toHaveCount(0);
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

/** The Comments panel that sits below every board tab. */
export async function commentsPanel(page: Page, total: number) {
  const h = onScreen(page.getByText(`Comments (${total})`, { exact: true })).first();
  await expect(h).toBeVisible();
  const panel = h.locator('xpath=ancestor::div[contains(@class,"rounded")][last()]');
  await expect(panel).toBeVisible();
  return panel;
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
